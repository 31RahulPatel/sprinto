import { Injectable, NotFoundException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateCloudAccountDto } from './dto/create-cloud-account.dto';
import { encrypt } from '../common/crypto.util';
import { ownerWhere, ownerData } from '../common/ownership.util';

const cloudAccountSelect = {
  id: true,
  provider: true,
  accountId: true,
  displayName: true,
  region: true,
  createdAt: true,
} as const;

@Injectable()
export class CloudAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  getSetupInfo(user: AuthenticatedUser) {
    // Deterministic, not random: this must stay stable across repeated calls (page reloads,
    // React Query refetches, multiple tabs) for the SAME account, since it gets pasted into an
    // IAM role's trust policy once and is expected to keep matching on every future scan. A
    // random ID here would force re-editing the trust policy in AWS every time this is fetched.
    const ownerId = user.organizationId ?? user.id;
    const externalId = createHmac('sha256', process.env.ENCRYPTION_KEY ?? '')
      .update(ownerId)
      .digest('hex')
      .slice(0, 32);
    const principalArn = process.env.PLATFORM_AWS_PRINCIPAL_ARN ?? '';
    const roleName = 'CompliancePlatformScannerRole';

    const trustPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: principalArn },
          Action: 'sts:AssumeRole',
          Condition: { StringEquals: { 'sts:ExternalId': externalId } },
        },
      ],
    };

    const inlinePolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'ReadOnlyS3ForComplianceScanning',
          Effect: 'Allow',
          Action: [
            's3:ListAllMyBuckets',
            's3:GetBucketAcl',
            's3:GetBucketPolicy',
            's3:GetBucketPolicyStatus',
            's3:GetBucketPublicAccessBlock',
            's3:GetBucketLocation',
            's3:GetBucketLogging',
            's3:GetBucketVersioning',
            's3:GetEncryptionConfiguration',
            's3:GetLifecycleConfiguration',
            's3:GetReplicationConfiguration',
            's3:GetBucketTagging',
          ],
          Resource: '*',
        },
      ],
    };

    // IAM's own read surface is broad (users/roles/policies/credential reports/MFA/access keys),
    // so rather than hand-enumerating dozens of iam:Get*/List* actions in a custom inline policy
    // (as done for S3 above), this attaches AWS's own managed policy scoped specifically to
    // read-only IAM access — still least-privilege for what it covers, just not hand-rolled.
    //
    // RDS, Lambda, and CloudTrail get the same treatment for the same reason. VPC does too, for an
    // extra reason found while wiring this up: several Prowler checks in those services reach into
    // *other* services for context at scan time regardless of `--service` scoping — e.g.
    // `rds_instance_no_public_access` also reads EC2 security groups and VPC subnets, and
    // `awslambda_function_vpc_multi_az` also reads VPC subnets — so hand-rolling a policy scoped
    // to just one service's own API calls would silently 403 on those specific checks. AWS's own
    // read-only policies for RDS/Lambda already include exactly the EC2/VPC describe actions their
    // cross-service checks need, and attaching VPCReadOnlyAccess alongside covers the rest.
    const managedPolicyArns = [
      'arn:aws:iam::aws:policy/IAMReadOnlyAccess',
      'arn:aws:iam::aws:policy/AmazonRDSReadOnlyAccess',
      'arn:aws:iam::aws:policy/AmazonVPCReadOnlyAccess',
      'arn:aws:iam::aws:policy/AWSLambda_ReadOnlyAccess',
      'arn:aws:iam::aws:policy/AWSCloudTrail_ReadOnlyAccess',
    ];

    return { externalId, principalArn, roleName, trustPolicy, inlinePolicy, managedPolicyArns };
  }

  async create(dto: CreateCloudAccountDto, user: AuthenticatedUser) {
    const credentialsEncrypted = encrypt(
      JSON.stringify({ roleArn: dto.roleArn, externalId: dto.externalId }),
    );

    return this.prisma.cloudAccount.create({
      data: {
        provider: 'AWS',
        accountId: dto.accountId,
        displayName: dto.displayName,
        region: dto.region,
        credentialsEncrypted,
        ...ownerData(user),
      },
      select: cloudAccountSelect,
    });
  }

  findAll(user: AuthenticatedUser) {
    return this.prisma.cloudAccount.findMany({
      where: ownerWhere(user),
      select: cloudAccountSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string, user: AuthenticatedUser) {
    const account = await this.prisma.cloudAccount.findFirst({
      where: { id, ...ownerWhere(user) },
    });
    if (!account) {
      throw new NotFoundException('Cloud account not found');
    }
    await this.prisma.cloudAccount.delete({ where: { id } });
  }
}
