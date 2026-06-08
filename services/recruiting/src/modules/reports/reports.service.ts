import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import { UserRole } from '@wr/contracts';



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

    const prevYear = year - 1;
    const startOfPrevYear = new Date(prevYear, 0, 1);
    const endOfPrevYear = new Date(prevYear, 11, 31, 23, 59, 59, 999);

    // Current Year Data
    const requests = await this.prisma.recruitmentRequest.findMany({
      where: {
        createdAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      include: {
        department: true,
        applications: true,
      },
    });

    const totalRequests = requests.length;
    const completedHires = requests
      .filter((r) => r.status === 'CLOSED' || r.status === 'OFFER_ACCEPTED')
      .reduce((sum, r) => sum + r.applications.filter((a) => a.status === 'OFFER_ACCEPTED').length, 0);

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

    // Previous Year Data
    const prevRequests = await this.prisma.recruitmentRequest.findMany({
      where: {
        createdAt: {
          gte: startOfPrevYear,
          lte: endOfPrevYear,
        },
      },
      include: {
        applications: true,
      },
    });

    const prevRequestsCount = prevRequests.length;
    const prevCompletedHires = prevRequests
      .filter((r) => r.status === 'CLOSED' || r.status === 'OFFER_ACCEPTED')
      .reduce((sum, r) => sum + r.applications.filter((a) => a.status === 'OFFER_ACCEPTED').length, 0);

    const prevInterviews = await this.prisma.interviewSchedule.count({
      where: {
        scheduledAt: {
          gte: startOfPrevYear,
          lte: endOfPrevYear,
        },
      },
    });

    const calculateGrowth = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number((((curr - prev) / prev) * 100).toFixed(2));
    };

    const yoyComparison = {
      previousYear: prevYear,
      requests: {
        current: totalRequests,
        previous: prevRequestsCount,
        growthPercentage: calculateGrowth(totalRequests, prevRequestsCount),
      },
      interviews: {
        current: totalInterviews,
        previous: prevInterviews,
        growthPercentage: calculateGrowth(totalInterviews, prevInterviews),
      },
      completedHires: {
        current: completedHires,
        previous: prevCompletedHires,
        growthPercentage: calculateGrowth(completedHires, prevCompletedHires),
      },
    };

    // Department Breakdown
    const deptMap = new Map<string, {
      departmentId: string;
      departmentName: string;
      departmentCode: string;
      totalRequests: number;
      targetHeadcount: number;
      totalFilled: number;
    }>();

    for (const req of requests) {
      const deptId = req.department.id;
      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, {
          departmentId: deptId,
          departmentName: req.department.name,
          departmentCode: req.department.code,
          totalRequests: 0,
          targetHeadcount: 0,
          totalFilled: 0,
        });
      }

      const deptData = deptMap.get(deptId)!;
      deptData.totalRequests++;
      deptData.targetHeadcount += req.headcount;
      deptData.totalFilled += req.applications.filter((a) => a.status === 'OFFER_ACCEPTED').length;
    }

    const departmentBreakdown = Array.from(deptMap.values()).map((dept) => {
      const fillRate = dept.targetHeadcount > 0 ? Number(((dept.totalFilled / dept.targetHeadcount) * 100).toFixed(2)) : 0;
      return {
        ...dept,
        fillRate,
      };
    });

    return {
      year,
      summary: {
        totalRequests,
        totalInterviews,
        completedHires,
        monthlyRequests,
      },
      yoyComparison,
      departmentBreakdown,
    };
  }

  async getAnnualReportExport(payload: { year: number; format: 'csv' | 'pdf' }) {
    const { year, format } = payload;
    const report = await this.getAnnualReport({ year });

    if (format === 'csv') {
      return {
        format: 'csv',
        data: this.generateCSV(report),
      };
    } else {
      const pdfBuffer = await this.generatePDF(report);
      return {
        format: 'pdf',
        data: pdfBuffer.toString('base64'),
      };
    }
  }

  private generateCSV(report: any): string {
    const csvLines: string[] = [];

    csvLines.push(`Annual Recruitment Report - ${report.year}`);
    csvLines.push('');

    csvLines.push('SUMMARY');
    csvLines.push('Total Requests,Total Interviews,Completed Hires');
    csvLines.push(`${report.summary.totalRequests},${report.summary.totalInterviews},${report.summary.completedHires}`);
    csvLines.push('');

    csvLines.push(`YEAR-OVER-YEAR COMPARISON (vs ${report.yoyComparison.previousYear})`);
    csvLines.push('Metric,Current Year,Previous Year,Growth %');
    csvLines.push(`Requests,${report.yoyComparison.requests.current},${report.yoyComparison.requests.previous},${report.yoyComparison.requests.growthPercentage}%`);
    csvLines.push(`Interviews,${report.yoyComparison.interviews.current},${report.yoyComparison.interviews.previous},${report.yoyComparison.interviews.growthPercentage}%`);
    csvLines.push(`Completed Hires,${report.yoyComparison.completedHires.current},${report.yoyComparison.completedHires.previous},${report.yoyComparison.completedHires.growthPercentage}%`);
    csvLines.push('');

    csvLines.push('DEPARTMENT BREAKDOWN');
    csvLines.push('Department,Code,Total Requests,Target Headcount,Total Filled,Fill Rate %');
    for (const dept of report.departmentBreakdown) {
      csvLines.push(`"${dept.departmentName.replace(/"/g, '""')}",${dept.departmentCode},${dept.totalRequests},${dept.targetHeadcount},${dept.totalFilled},${dept.fillRate}%`);
    }

    return csvLines.join('\n');
  }

  private async generatePDF(report: any): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: any) => reject(err));

      // Header / Title
      doc.fontSize(20).text(`Annual Recruitment Report - ${report.year}`, { align: 'center' });
      doc.moveDown(1.5);

      // Section 1: Summary
      doc.fontSize(14).text('1. Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Total Requests: ${report.summary.totalRequests}`);
      doc.text(`Total Interviews: ${report.summary.totalInterviews}`);
      doc.text(`Completed Hires: ${report.summary.completedHires}`);
      doc.moveDown(1.5);

      // Section 2: YoY Comparison
      doc.fontSize(14).text(`2. Year-over-Year Comparison (vs ${report.yoyComparison.previousYear})`, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Requests: ${report.yoyComparison.requests.current} (Current) vs ${report.yoyComparison.requests.previous} (Previous) | Growth: ${report.yoyComparison.requests.growthPercentage}%`);
      doc.text(`Interviews: ${report.yoyComparison.interviews.current} (Current) vs ${report.yoyComparison.interviews.previous} (Previous) | Growth: ${report.yoyComparison.interviews.growthPercentage}%`);
      doc.text(`Completed Hires: ${report.yoyComparison.completedHires.current} (Current) vs ${report.yoyComparison.completedHires.previous} (Previous) | Growth: ${report.yoyComparison.completedHires.growthPercentage}%`);
      doc.moveDown(1.5);

      // Section 3: Department Breakdown
      doc.fontSize(14).text('3. Department Breakdown', { underline: true });
      doc.moveDown(0.5);
      for (const dept of report.departmentBreakdown) {
        doc.fontSize(12).text(`${dept.departmentName} (${dept.departmentCode}):`);
        doc.fontSize(10).text(`  - Total Requests: ${dept.totalRequests}`);
        doc.text(`  - Target Headcount: ${dept.targetHeadcount}`);
        doc.text(`  - Total Filled: ${dept.totalFilled}`);
        doc.text(`  - Fill Rate: ${dept.fillRate}%`);
        doc.moveDown(0.5);
      }

      doc.end();
    });
  }

  async getRealtimeTracking(payload: { userId: string; role: string }) {
    const { userId, role } = payload;

    const where: any = {};
    if (role === UserRole.DEPARTMENT_HEAD) {
      where.createdById = userId;
    }

    const requests = await this.prisma.recruitmentRequest.findMany({
      where,
      include: {
        createdBy: {
          select: { displayName: true },
        },
        reviewedBy: {
          select: { displayName: true },
        },
        applications: {
          where: { status: 'OFFER_ACCEPTED' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((req) => {
      return {
        id: req.id,
        position: req.position,
        targetHeadcount: req.headcount,
        filledHeadcount: req.applications.length,
        status: req.status,
        createdBy: req.createdBy.displayName,
        handler: req.reviewedBy ? req.reviewedBy.displayName : 'Not Assigned',
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
      };
    });
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
