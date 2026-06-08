import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import { UserRole } from '@wr/contracts';

type RecruitmentRequestSummary = {
  id: string;
  status: string;
  headcount: number;
  createdAt: Date;
};

type DepartmentRequestSummary = {
  status: string;
  headcount: number;
};

type CompletedRequestSummary = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};

type RequestLogEntry = {
  requestId: string;
  fromStatus: string | null;
  createdAt: Date;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnnualReport(payload: { year: number }) {
    const { year } = payload;
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const requests: RecruitmentRequestSummary[] = await this.prisma.recruitmentRequest.findMany({
      where: {
        createdAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      select: {
        id: true,
        status: true,
        headcount: true,
        createdAt: true,
      },
    });

    const totalRequests = requests.length;
    const completedHires = requests
      .filter((r: RecruitmentRequestSummary) => r.status === 'CLOSED' || r.status === 'OFFER_ACCEPTED')
      .reduce((sum: number, r: RecruitmentRequestSummary) => sum + r.headcount, 0);

    const monthlyRequests = Array(12).fill(0);
    for (const req of requests) {
      const month = new Date(req.createdAt).getMonth();
      monthlyRequests[month]++;
    }

    const totalInterviews = await this.prisma.interviewSchedule.count({
      where: {
        scheduledAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
    });

    return {
      year,
      totalRequests,
      totalInterviews,
      completedHires,
      monthlyRequests,
    };
  }

  async getDepartmentReport(payload: { id: string; userId: string; role: string }) {
    const { id: departmentId, userId, role } = payload;

    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Department with ID ${departmentId} not found`,
      });
    }

    if (role === UserRole.DEPARTMENT_HEAD) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { departmentId: true },
      });

      if (department.headUserId !== userId && user?.departmentId !== departmentId) {
        throw new RpcException({
          status: HttpStatus.FORBIDDEN,
          message: `Access denied. You do not have permission to view reports for department ${department.name}`,
        });
      }
    }

    const requests: DepartmentRequestSummary[] = await this.prisma.recruitmentRequest.findMany({
      where: { departmentId },
      select: {
        status: true,
        headcount: true,
      },
    });

    const totalRequests = requests.length;
    const totalHeadcount = requests.reduce((sum: number, r: DepartmentRequestSummary) => sum + r.headcount, 0);

    const statusBreakdown: Record<string, number> = {};
    for (const req of requests) {
      statusBreakdown[req.status] = (statusBreakdown[req.status] || 0) + 1;
    }

    return {
      department: {
        id: department.id,
        name: department.name,
        code: department.code,
        headUserId: department.headUserId,
      },
      totalRequests,
      totalHeadcount,
      statusBreakdown,
    };
  }

  async getTimeToHireReport() {
    const completedRequests: CompletedRequestSummary[] = await this.prisma.recruitmentRequest.findMany({
      where: {
        status: { in: ['CLOSED', 'OFFER_ACCEPTED'] },
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (completedRequests.length === 0) {
      return {
        averageTimeToHireDays: 0,
        averageTimeInStageDays: {},
        totalCompletedHires: 0,
      };
    }

    let totalTimeToHireMs = 0;
    const requestIds = completedRequests.map((r: CompletedRequestSummary) => r.id);

    const logs: RequestLogEntry[] = await this.prisma.requestLog.findMany({
      where: {
        requestId: { in: requestIds },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const logsByRequest = new Map<string, RequestLogEntry[]>();
    for (const log of logs) {
      if (!logsByRequest.has(log.requestId)) {
        logsByRequest.set(log.requestId, []);
      }
      logsByRequest.get(log.requestId)!.push(log);
    }

    const stageTimes: Record<string, number> = {};
    const stageCounts: Record<string, number> = {};

    for (const req of completedRequests) {
      const reqLogs = logsByRequest.get(req.id) || [];
      const timeline = [
        { status: 'DRAFT', time: req.createdAt.getTime() },
        ...reqLogs.map((log: RequestLogEntry) => ({
          status: log.fromStatus || 'DRAFT',
          time: log.createdAt.getTime(),
        })),
        { status: 'CLOSED', time: req.updatedAt.getTime() },
      ];

      timeline.sort((a, b) => a.time - b.time);

      for (let i = 0; i < timeline.length - 1; i++) {
        const current = timeline[i];
        const next = timeline[i + 1];
        if (current && next) {
          const duration = next.time - current.time;
          const stageName = current.status;

          if (duration > 0) {
            stageTimes[stageName] = (stageTimes[stageName] || 0) + duration;
            stageCounts[stageName] = (stageCounts[stageName] || 0) + 1;
          }
        }
      }

      totalTimeToHireMs += req.updatedAt.getTime() - req.createdAt.getTime();
    }

    const averageTimeToHireDays = totalTimeToHireMs / completedRequests.length / (1000 * 60 * 60 * 24);

    const averageTimeInStageDays: Record<string, number> = {};
    for (const stage of Object.keys(stageTimes)) {
      const totalTime = stageTimes[stage] ?? 0;
      const count = stageCounts[stage] ?? 1;
      const averageMs = totalTime / count;
      averageTimeInStageDays[stage] = Number((averageMs / (1000 * 60 * 60 * 24)).toFixed(2));
    }

    return {
      averageTimeToHireDays: Number(averageTimeToHireDays.toFixed(2)),
      averageTimeInStageDays,
      totalCompletedHires: completedRequests.length,
    };
  }

  async getPipelineOverview() {
    const requests = await this.prisma.recruitmentRequest.groupBy({
      by: ['status'],
      _count: {
        _all: true,
      },
    });

    const breakdown: Record<string, number> = {
      DRAFT: 0,
      PENDING_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
      REVISION_NEEDED: 0,
      PLANNING: 0,
      PLAN_APPROVED: 0,
      SCREENING: 0,
      INTERVIEWING: 0,
      OFFER_EXTENDED: 0,
      OFFER_ACCEPTED: 0,
      CLOSED: 0,
      CANCELLED: 0,
    };

    for (const group of requests) {
      if (group.status in breakdown) {
        breakdown[group.status] = group._count._all;
      }
    }

    const activeCampaigns = await this.prisma.overallPlan.count({
      where: {
        status: 'APPROVED',
        endDate: {
          gte: new Date(),
        },
      },
    });

    const totalCampaigns = await this.prisma.overallPlan.count();

    return {
      totalActiveCampaigns: activeCampaigns,
      totalCampaigns,
      breakdown,
    };
  }

  async getHiringMetrics(payload: {
    departmentId?: string;
    startDate?: string;
    endDate?: string;
    period?: 'monthly' | 'quarterly' | 'yearly';
  }) {
    const { departmentId, startDate, endDate, period = 'monthly' } = payload;

    const where: any = {};
    if (departmentId) {
      where.departmentId = departmentId;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const requests = await this.prisma.recruitmentRequest.findMany({
      where,
      include: {
        applications: true,
        offers: true,
      },
    });

    const groups = new Map<string, typeof requests>();

    for (const req of requests) {
      const date = new Date(req.createdAt);
      let periodKey = '';
      if (period === 'yearly') {
        periodKey = String(date.getFullYear());
      } else if (period === 'quarterly') {
        const quarter = Math.ceil((date.getMonth() + 1) / 3);
        periodKey = `${date.getFullYear()}-Q${quarter}`;
      } else {
        const month = String(date.getMonth() + 1).padStart(2, '0');
        periodKey = `${date.getFullYear()}-${month}`;
      }

      if (!groups.has(periodKey)) {
        groups.set(periodKey, []);
      }
      groups.get(periodKey)!.push(req);
    }

    const parseCompensation = (compString: string | undefined | null): number => {
      if (!compString) return 30000000;
      const digitsOnly = compString.replace(/\D/g, '');
      if (!digitsOnly) return 30000000;
      const parsed = parseInt(digitsOnly, 10);
      if (isNaN(parsed) || parsed <= 0) return 30000000;
      return parsed < 100000 ? parsed * 1000000 : parsed;
    };

    const result = [];

    for (const [periodKey, reqs] of groups.entries()) {
      let totalRequested = 0;
      let totalFilled = 0;
      let totalCost = 0;
      let timeToHireCount = 0;
      let totalTimeToHireDays = 0;

      for (const req of reqs) {
        totalRequested += req.headcount;

        const filledApps = req.applications.filter((a) => a.status === 'OFFER_ACCEPTED');
        totalFilled += filledApps.length;

        for (const app of filledApps) {
          const offer = req.offers.find((o) => o.candidateId === app.candidateId);
          const comp = offer ? offer.compensation : null;
          const compVal = parseCompensation(comp);
          totalCost += 15000000 + compVal * 0.1;
        }

        if (req.status === 'CLOSED' || req.status === 'OFFER_ACCEPTED') {
          const timeToHireMs = req.updatedAt.getTime() - req.createdAt.getTime();
          const timeToHireDays = Math.max(0, timeToHireMs / (1000 * 60 * 60 * 24));
          totalTimeToHireDays += timeToHireDays;
          timeToHireCount++;
        }
      }

      const fillRate = totalRequested > 0 ? Number(((totalFilled / totalRequested) * 100).toFixed(2)) : 0;
      const averageTimeToHireDays = timeToHireCount > 0 ? Number((totalTimeToHireDays / timeToHireCount).toFixed(2)) : 0;
      const costPerHire = totalFilled > 0 ? Number((totalCost / totalFilled).toFixed(2)) : 0;

      result.push({
        period: periodKey,
        totalRequested,
        totalFilled,
        fillRate,
        averageTimeToHireDays,
        totalCost,
        costPerHire,
      });
    }

    result.sort((a, b) => a.period.localeCompare(b.period));

    return result;
  }
}
