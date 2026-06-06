import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import { UserRole } from '@wr/contracts';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnnualReport(payload: { year: number }) {
    const { year } = payload;
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    const requests = await this.prisma.recruitmentRequest.findMany({
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
      .filter((r) => r.status === 'CLOSED' || r.status === 'OFFER_ACCEPTED')
      .reduce((sum, r) => sum + r.headcount, 0);

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

    const requests = await this.prisma.recruitmentRequest.findMany({
      where: { departmentId },
      select: {
        status: true,
        headcount: true,
      },
    });

    const totalRequests = requests.length;
    const totalHeadcount = requests.reduce((sum, r) => sum + r.headcount, 0);

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
    const completedRequests = await this.prisma.recruitmentRequest.findMany({
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
    const requestIds = completedRequests.map((r) => r.id);

    const logs = await this.prisma.requestLog.findMany({
      where: {
        requestId: { in: requestIds },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const logsByRequest = new Map<string, typeof logs>();
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
        ...reqLogs.map((log) => ({
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
}
