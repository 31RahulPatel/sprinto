import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { ownerWhere } from '../common/ownership.util';

const IMPLEMENTED_SERVICES = ['s3', 'iam', 'rds', 'vpc', 'lambda', 'cloudtrail'];
const NOT_YET_IMPLEMENTED_SERVICES = ['ec2'];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(user: AuthenticatedUser) {
    const scanWhere = ownerWhere(user);

    const [totalFindings, critical, high, medium, low, totalScans, completedScans] =
      await Promise.all([
        this.prisma.finding.count({ where: { scan: scanWhere } }),
        this.prisma.finding.count({ where: { severity: 'CRITICAL', scan: scanWhere } }),
        this.prisma.finding.count({ where: { severity: 'HIGH', scan: scanWhere } }),
        this.prisma.finding.count({ where: { severity: 'MEDIUM', scan: scanWhere } }),
        this.prisma.finding.count({ where: { severity: 'LOW', scan: scanWhere } }),
        this.prisma.scan.count({ where: scanWhere }),
        this.prisma.scan.findMany({
          where: { ...scanWhere, status: 'COMPLETED', totalChecks: { not: null } },
          include: { _count: { select: { findings: true } } },
          orderBy: { completedAt: 'desc' },
        }),
      ]);

    const scoreOf = (totalChecks: number | null, failedCount: number): number | null =>
      totalChecks && totalChecks > 0
        ? Math.round(((totalChecks - failedCount) / totalChecks) * 100)
        : null;

    const totalChecksSum = completedScans.reduce((sum, s) => sum + (s.totalChecks ?? 0), 0);
    const totalFailedSum = completedScans.reduce((sum, s) => sum + s._count.findings, 0);
    const complianceScore = scoreOf(totalChecksSum, totalFailedSum);

    return {
      totalFindings,
      critical,
      high,
      medium,
      low,
      totalScans,
      complianceScore,
      services: [
        ...IMPLEMENTED_SERVICES.map((service) => {
          const latestScan = completedScans.find((s) => s.service === service) ?? null;
          return {
            service,
            implemented: true,
            score: latestScan
              ? scoreOf(latestScan.totalChecks, latestScan._count.findings)
              : null,
            lastScanAt: latestScan?.completedAt ?? null,
            findingCount: latestScan?._count.findings ?? 0,
          };
        }),
        ...NOT_YET_IMPLEMENTED_SERVICES.map((service) => ({
          service,
          implemented: false,
          score: null,
          lastScanAt: null,
          findingCount: 0,
        })),
      ],
    };
  }
}
