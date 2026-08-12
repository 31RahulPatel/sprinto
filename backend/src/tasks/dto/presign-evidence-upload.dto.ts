import { IsIn, IsInt, IsString, Max, Min, MinLength } from 'class-validator';
import { EVIDENCE_MAX_BYTES, EVIDENCE_MIME_TYPES } from './evidence-constants';

export class PresignEvidenceUploadDto {
  @IsString()
  @MinLength(1)
  fileName: string;

  // Collected up front (not just at confirm) so it can drive the S3 object key, which is
  // fixed the moment the presigned URL is issued.
  @IsString()
  @MinLength(1)
  name: string;

  @IsIn(EVIDENCE_MIME_TYPES)
  mimeType: string;

  @IsInt()
  @Min(1)
  @Max(EVIDENCE_MAX_BYTES)
  sizeBytes: number;
}
