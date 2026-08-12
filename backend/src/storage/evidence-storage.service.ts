import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const PRESIGN_EXPIRY_SECONDS = 300;

// S3 sets this string as a literal HTTP response header, which — per HTTP/1.1 — must be
// representable in ISO-8859-1. macOS screenshot filenames routinely contain a narrow no-break
// space (U+202F) between the time and AM/PM, which falls outside that range and made every
// such preview/download fail with an InvalidArgument error. RFC 6266's filename* form carries
// the real name percent-encoded (pure ASCII, always valid), with an ASCII-only fallback name
// for the few clients that don't understand it.
function contentDisposition(fileName: string): string {
  const asciiFallback = fileName.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, "'");
  return `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

@Injectable()
export class EvidenceStorageService implements OnModuleInit {
  private readonly logger = new Logger(EvidenceStorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET ?? 'compliance-evidence';
    // S3_ENDPOINT is only set for a self-hosted S3-compatible target (MinIO in
    // docker-compose). Leave it unset to talk to real AWS S3 for the given region.
    const endpoint = process.env.S3_ENDPOINT || undefined;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    this.client = new S3Client({
      endpoint,
      region: process.env.S3_REGION ?? 'us-east-1',
      // Only pin static credentials when they're actually provided (required for MinIO).
      // Against real AWS S3, leaving this unset lets the SDK's default credential chain
      // pick up the EC2 instance role instead — no long-lived keys to manage or leak.
      ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
      // Path-style addressing is required for MinIO (no virtual-hosted-style support) but
      // should not be forced against real AWS S3, so key it off whether a custom endpoint
      // is actually in play.
      forcePathStyle: Boolean(endpoint),
    });
  }

  async onModuleInit() {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.ensureBucket();
        return;
      } catch (err) {
        if (attempt === 3) {
          this.logger.error(
            `Failed to provision evidence bucket "${this.bucket}" after ${attempt} attempts`,
            err as Error,
          );
          throw err;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  private async ensureBucket() {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Created evidence bucket "${this.bucket}"`);
    }
  }

  // Setting ContentType on the signed command means the browser's PUT must send that exact
  // Content-Type header or S3 rejects the signature — this is what keeps the declared MIME
  // type honest without the app ever touching the file's bytes.
  async presignPutUrl(key: string, mimeType: string): Promise<string> {
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: mimeType });
    return getSignedUrl(this.client, command, { expiresIn: PRESIGN_EXPIRY_SECONDS });
  }

  async presignGetUrl(key: string, fileName: string, mimeType: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ResponseContentDisposition: contentDisposition(fileName),
      ResponseContentType: mimeType,
    });
    return getSignedUrl(this.client, command, { expiresIn: PRESIGN_EXPIRY_SECONDS });
  }

  // Authoritative read of what actually landed in S3 after a presigned PUT — never trust the
  // client's declared size/type for the DB record.
  async headObject(key: string) {
    return this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  buildKey(ownerId: string, parentId: string, evidenceId: string, fileName: string): string {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `evidence/${ownerId}/${parentId}/${evidenceId}-${sanitized}`;
  }
}
