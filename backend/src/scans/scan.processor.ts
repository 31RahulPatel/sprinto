import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { mkdir, readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { decrypt } from '../common/crypto.util';
import { ControlsService } from '../controls/controls.service';
import { Severity } from '@prisma/client';

const execFileAsync = promisify(execFile);
const discoveryLogger = new Logger('discoverBucketRegions');

// S3 is a global service (one ListBuckets call returns every bucket regardless of region), so
// scanning a single hardcoded region would silently miss buckets that live elsewhere. This shells
// out to the `aws` CLI (same pattern as the `docker` calls below) using the platform identity to
// find out which regions actually have buckets before invoking Prowler with the real list.
async function discoverBucketRegions(
  roleArn: string,
  externalId: string,
  fallbackRegion: string,
): Promise<string[]> {
  const platformEnv = {
    ...process.env,
    AWS_ACCESS_KEY_ID: process.env.PLATFORM_AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.PLATFORM_AWS_SECRET_ACCESS_KEY,
  };

  try {
    // The platform user only has sts:AssumeRole — it must assume the customer's role before it
    // can call any S3 API in their account, same as Prowler does internally via --role/--external-id.
    const { stdout: assumeOut } = await execFileAsync(
      'aws',
      [
        'sts',
        'assume-role',
        '--role-arn',
        roleArn,
        '--external-id',
        externalId,
        '--role-session-name',
        'region-discovery',
        '--output',
        'json',
      ],
      { env: platformEnv },
    );
    const { Credentials } = JSON.parse(assumeOut) as {
      Credentials: { AccessKeyId: string; SecretAccessKey: string; SessionToken: string };
    };
    const assumedEnv = {
      ...process.env,
      AWS_ACCESS_KEY_ID: Credentials.AccessKeyId,
      AWS_SECRET_ACCESS_KEY: Credentials.SecretAccessKey,
      AWS_SESSION_TOKEN: Credentials.SessionToken,
    };

    const { stdout: listOut } = await execFileAsync(
      'aws',
      ['s3api', 'list-buckets', '--query', 'Buckets[].Name', '--output', 'json'],
      { env: assumedEnv },
    );
    const bucketNames: string[] = JSON.parse(listOut);
    if (bucketNames.length === 0) {
      return [fallbackRegion];
    }

    const regions = await Promise.all(
      bucketNames.map(async (name) => {
        const { stdout } = await execFileAsync(
          'aws',
          ['s3api', 'get-bucket-location', '--bucket', name, '--output', 'json'],
          { env: assumedEnv },
        );
        const { LocationConstraint } = JSON.parse(stdout) as { LocationConstraint: string | null };
        if (!LocationConstraint) return 'us-east-1';
        if (LocationConstraint === 'EU') return 'eu-west-1';
        return LocationConstraint;
      }),
    );

    return [...new Set(regions)];
  } catch (error) {
    // Discovery is a best-effort optimization; if it fails for any reason, fall back to the
    // account's configured region rather than failing the whole scan over it. Still log the real
    // cause though — a silent fallback here is exactly what made the last failure hard to debug.
    const stderr = (error as { stderr?: string })?.stderr;
    discoveryLogger.warn(
      `Region discovery failed, falling back to ${fallbackRegion}: ${stderr || (error as Error)?.message || error}`,
    );
    return [fallbackRegion];
  }
}

// Platform-facing service slugs (used in the DB, filters, and UI) match Prowler's own service
// names for every service except Lambda: Prowler calls it `awslambda` internally (`lambda` is a
// reserved word in Python), so that's the one translation needed for the `--service` CLI flag.
const PROWLER_SERVICE_NAME: Record<string, string> = {
  lambda: 'awslambda',
};

const SEVERITY_MAP: Record<string, Severity> = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFORMATIONAL: 'INFO',
  INFO: 'INFO',
};

function mapSeverity(raw: unknown): Severity {
  const key = String(raw ?? '').trim().toUpperCase();
  return SEVERITY_MAP[key] ?? 'INFO';
}

// OCSF (Open Cybersecurity Schema Framework) is Prowler's JSON output shape. `finding_info.title`
// is just the check's generic policy/goal statement (e.g. "X should have MFA enabled") — it reads
// the same regardless of pass or fail, so on a FAIL it looks backwards ("has MFA enabled" shown as
// a HIGH-severity problem). `message` is the specific, situation-accurate outcome (e.g. "...with
// MFA disabled for user X") and is what should actually be shown as the title.
function parseOcsfFinding(raw: any) {
  const findingInfo = raw.finding_info ?? {};
  const resource = Array.isArray(raw.resources) ? raw.resources[0] : undefined;
  const compliance = raw.compliance ?? {};
  const remediation = raw.remediation ?? {};
  const statusCode = String(raw.status_code ?? raw.status ?? '').toUpperCase();

  return {
    statusCode,
    title: raw.message ?? raw.status_detail ?? findingInfo.title ?? 'Untitled finding',
    description: findingInfo.desc ?? raw.message ?? '',
    severity: mapSeverity(raw.severity ?? findingInfo.severity),
    resource: resource?.uid ?? resource?.name ?? 'unknown',
    category: Array.isArray(raw.category_name)
      ? raw.category_name.join(', ')
      : (raw.category_name ?? 'general'),
    frameworks: Array.isArray(compliance.requirements)
      ? compliance.requirements.map(String)
      : [],
    remediation: remediation.desc ?? '',
  };
}

@Processor('scans')
export class ScanProcessor extends WorkerHost {
  private readonly logger = new Logger(ScanProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly controlsService: ControlsService,
  ) {
    super();
  }

  async process(job: Job<{ scanId: string }>): Promise<void> {
    const { scanId } = job.data;

    const scan = await this.prisma.scan.findUniqueOrThrow({
      where: { id: scanId },
      include: { cloudAccount: true },
    });

    await this.prisma.scan.update({
      where: { id: scanId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });

    try {
      const { roleArn, externalId } = JSON.parse(
        decrypt(scan.cloudAccount.credentialsEncrypted),
      ) as { roleArn: string; externalId: string };

      const outputDir = join(process.cwd(), '..', 'reports', scanId);
      await mkdir(outputDir, { recursive: true });

      // Region discovery only makes sense for S3 (buckets are global but each one has its own
      // home region). IAM has no per-resource region concept — it's a single global service — so
      // there's nothing to discover; the account's configured region is just used for the SDK
      // session itself, not as a resource filter.
      const regions =
        scan.service === 's3'
          ? await discoverBucketRegions(roleArn, externalId, scan.cloudAccount.region)
          : [scan.cloudAccount.region];
      this.logger.log(`Scan ${scanId}: scanning region(s) ${regions.join(', ')}`);

      const args = [
        'run',
        '--rm',
        '-e',
        `AWS_ACCESS_KEY_ID=${process.env.PLATFORM_AWS_ACCESS_KEY_ID}`,
        '-e',
        `AWS_SECRET_ACCESS_KEY=${process.env.PLATFORM_AWS_SECRET_ACCESS_KEY}`,
        '-e',
        `AWS_DEFAULT_REGION=${regions[0]}`,
        '-v',
        `${outputDir}:/output`,
        'toniblyx/prowler:latest',
        'aws',
        '--role',
        roleArn,
        '--external-id',
        externalId,
        '--role-session-name',
        `compliance-scan-${scanId}`.slice(0, 64),
        '--region',
        ...regions,
        '--service',
        PROWLER_SERVICE_NAME[scan.service] ?? scan.service,
        '--output-formats',
        'json-ocsf',
        '--output-directory',
        '/output',
        '--output-filename',
        'scan',
        '--no-banner',
        '--ignore-exit-code-3',
      ];

      this.logger.log(`Running Prowler for scan ${scanId}: docker ${args.join(' ')}`);
      await execFileAsync('docker', args, { maxBuffer: 1024 * 1024 * 50 });

      const files = await readdir(outputDir);
      const jsonFiles = await Promise.all(
        files
          .filter((f) => f.endsWith('.json'))
          .map(async (f) => ({ f, mtime: (await stat(join(outputDir, f))).mtimeMs })),
      );
      jsonFiles.sort((a, b) => b.mtime - a.mtime);
      const latest = jsonFiles[0];
      if (!latest) {
        throw new Error(`Prowler produced no JSON output in ${outputDir}`);
      }

      const reportPath = join(outputDir, latest.f);
      const raw = JSON.parse(await readFile(reportPath, 'utf8'));
      const rows: any[] = Array.isArray(raw) ? raw : (raw.findings ?? []);

      const parsed = rows.map(parseOcsfFinding).filter((f) => f.statusCode === 'FAIL');

      if (parsed.length > 0) {
        const owner = { organizationId: scan.organizationId, userId: scan.userId };
        const uniqueCodes = [...new Set(parsed.map((f) => f.frameworks[0]).filter((c): c is string => !!c))];
        const controlIds = new Map<string, string>();
        for (const code of uniqueCodes) {
          const control = await this.controlsService.findOrCreate(code, null, owner);
          controlIds.set(code, control.id);
        }

        await this.prisma.finding.createMany({
          data: parsed.map((f) => ({
            scanId,
            title: f.title,
            description: f.description,
            severity: f.severity,
            resource: f.resource,
            service: scan.service,
            category: f.category,
            frameworks: f.frameworks,
            remediation: f.remediation,
            controlId: f.frameworks[0] ? controlIds.get(f.frameworks[0]) : undefined,
          })),
        });
      }

      await this.prisma.scan.update({
        where: { id: scanId },
        data: { status: 'COMPLETED', completedAt: new Date(), reportPath, totalChecks: rows.length },
      });

      this.logger.log(`Scan ${scanId} completed with ${parsed.length} finding(s).`);

      if (scan.verifiesFindingId) {
        try {
          await this.applyVerificationResult(scan, parsed);
        } catch (verificationError) {
          this.logger.error(
            `Scan ${scanId} completed but verification bookkeeping failed: ${
              verificationError instanceof Error ? verificationError.message : String(verificationError)
            }`,
          );
        }
      }
    } catch (error) {
      const stderr = (error as { stderr?: string })?.stderr;
      const message =
        stderr || (error instanceof Error ? error.message : String(error));
      this.logger.error(`Scan ${scanId} failed: ${message}`);
      await this.prisma.scan.update({
        where: { id: scanId },
        data: { status: 'FAILED', completedAt: new Date(), errorMessage: message.slice(0, 2000) },
      });

      if (scan.verifiesFindingId) {
        try {
          const original = await this.prisma.finding.findUnique({
            where: { id: scan.verifiesFindingId },
            select: { assigneeId: true },
          });
          if (original?.assigneeId) {
            await this.applyFailureOutcome(
              scan,
              scan.verifiesFindingId,
              original.assigneeId,
              `Automatic verification scan could not complete: ${message.slice(0, 300)}`,
            );
          }
        } catch (verificationError) {
          this.logger.error(
            `Scan ${scanId} failed and verification-failure bookkeeping also failed: ${
              verificationError instanceof Error ? verificationError.message : String(verificationError)
            }`,
          );
        }
      }
    }
  }

  private async getVerificationMode(scan: {
    organizationId: string | null;
    userId: string | null;
  }): Promise<'AUTO_WITH_FALLBACK' | 'AUTO_ONLY' | 'MANUAL_ONLY'> {
    if (scan.organizationId) {
      const org = await this.prisma.organization.findUniqueOrThrow({
        where: { id: scan.organizationId },
        select: { evidenceVerificationMode: true },
      });
      return org.evidenceVerificationMode;
    }
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: scan.userId ?? undefined },
      select: { evidenceVerificationMode: true },
    });
    return user.evidenceVerificationMode;
  }

  private async applyVerificationResult(
    scan: {
      id: string;
      verifiesFindingId: string | null;
      verifiesEvidenceId: string | null;
      organizationId: string | null;
      userId: string | null;
    },
    parsed: ReturnType<typeof parseOcsfFinding>[],
  ): Promise<void> {
    const findingId = scan.verifiesFindingId;
    if (!findingId) return;

    const original = await this.prisma.finding.findUnique({
      where: { id: findingId },
      select: { resource: true, category: true, assigneeId: true },
    });
    if (!original || !original.assigneeId) return;

    const stillFailing = parsed.some(
      (f) => f.resource === original.resource && f.category === original.category,
    );

    if (!stillFailing) {
      await this.prisma.$transaction([
        this.prisma.finding.update({
          where: { id: findingId },
          data: { status: 'RESOLVED', resolvedAt: new Date(), rejectionReason: null },
        }),
        ...(scan.verifiesEvidenceId
          ? [
              this.prisma.evidence.update({
                where: { id: scan.verifiesEvidenceId },
                data: { verificationStatus: 'AUTO_VERIFIED', verificationMethod: 'AUTOMATIC', verifiedAt: new Date() },
              }),
            ]
          : []),
        this.prisma.findingActivity.create({
          data: {
            findingId,
            actorId: original.assigneeId,
            type: 'SCAN_PASSED',
            note: 'Automatic re-scan found the resource now compliant',
          },
        }),
        this.prisma.findingActivity.create({
          data: {
            findingId,
            actorId: original.assigneeId,
            type: 'REVIEW_APPROVED',
            fromStatus: 'UNDER_REVIEW',
            toStatus: 'RESOLVED',
            note: 'Automatically approved',
          },
        }),
      ]);
      this.logger.log(`Verification scan ${scan.id}: finding ${findingId} auto-resolved.`);
      return;
    }

    await this.applyFailureOutcome(
      scan,
      findingId,
      original.assigneeId,
      'Automatic re-scan still found this condition present',
    );
  }

  // Shared by both "scan ran and the check still fails" and "the scan itself errored out" —
  // the spec treats both as the same non-compliant outcome: never auto-mark resolved, and either
  // send the assignee back to work (AUTO_ONLY) or fall back to manual review (AUTO_WITH_FALLBACK).
  private async applyFailureOutcome(
    scan: { id: string; verifiesEvidenceId: string | null; organizationId: string | null; userId: string | null },
    findingId: string,
    assigneeId: string,
    reason: string,
  ): Promise<void> {
    const mode = await this.getVerificationMode(scan);

    if (mode === 'AUTO_ONLY') {
      await this.prisma.$transaction([
        this.prisma.finding.update({
          where: { id: findingId },
          data: { status: 'IN_PROGRESS', rejectionReason: reason },
        }),
        ...(scan.verifiesEvidenceId
          ? [
              this.prisma.evidence.update({
                where: { id: scan.verifiesEvidenceId },
                data: { verificationStatus: 'VERIFICATION_FAILED', verificationMethod: 'AUTOMATIC', verifiedAt: new Date() },
              }),
            ]
          : []),
        this.prisma.findingActivity.create({
          data: {
            findingId,
            actorId: assigneeId,
            type: 'SCAN_FAILED',
            fromStatus: 'UNDER_REVIEW',
            toStatus: 'IN_PROGRESS',
            note: reason,
          },
        }),
      ]);
      this.logger.log(`Verification scan ${scan.id}: finding ${findingId} failed verification (AUTO_ONLY, sent back).`);
    } else {
      // AUTO_WITH_FALLBACK: leave the finding at UNDER_REVIEW so the existing manual
      // /review endpoint picks it up — no finding/evidence status change needed here.
      await this.prisma.findingActivity.create({
        data: {
          findingId,
          actorId: assigneeId,
          type: 'SCAN_FAILED',
          note: `${reason} — sent to a reviewer for manual verification`,
        },
      });
      this.logger.log(`Verification scan ${scan.id}: finding ${findingId} failed verification, falling back to manual review.`);
    }
  }
}
