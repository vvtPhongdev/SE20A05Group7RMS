import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import {
  InterviewStatus,
  isHrRole,
  PlanStatus,
  RecruitmentRequestStatus,
  TaskStatus,
  TaskType,
  UserRole,
} from '@wr/contracts';

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

const QUEUE_STATUSES = [
  RecruitmentRequestStatus.PENDING_HR_REVIEW,
  RecruitmentRequestStatus.PENDING_REVIEW,
  RecruitmentRequestStatus.PENDING_BOSS_APPROVAL,
  RecruitmentRequestStatus.REVISION_NEEDED,
];

const SUBMISSION_ACTIONS = new Set(['CREATED', 'SUBMITTED_FOR_REVIEW', 'RESUBMITTED_FOR_REVIEW']);
const HR_REVIEW_ACTIONS = new Set(['HR_FORWARDED_TO_ADMIN', 'HR_RETURNED_FOR_REVISION']);
const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getHrRequestQueueSummary() {
    const requests = await this.prisma.recruitmentRequest.findMany({
      where: { status: { in: QUEUE_STATUSES } },
      select: {
        id: true,
        status: true,
        createdAt: true,
        department: { select: { name: true } },
        logs: {
          select: { action: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));

    const reviewDurations: number[] = [];
    const reviewedThisWeek = new Set<string>();
    const forwardedThisWeek = new Set<string>();
    const distribution = new Map<string, number>();
    let oldestPendingDays = 0;

    for (const request of requests) {
      const department = request.department?.name ?? 'Unassigned';
      distribution.set(department, (distribution.get(department) ?? 0) + 1);

      let latestSubmission = request.createdAt;
      let latestForward: Date | null = null;
      for (const log of request.logs) {
        if (SUBMISSION_ACTIONS.has(log.action)) {
          latestSubmission = log.createdAt;
        }

        if (log.action === 'HR_FORWARDED_TO_ADMIN') {
          latestForward = log.createdAt;
          if (log.createdAt >= latestSubmission) {
            reviewDurations.push(
              (log.createdAt.getTime() - latestSubmission.getTime()) / MS_PER_DAY,
            );
          }
        }

        if (log.createdAt >= startOfWeek && HR_REVIEW_ACTIONS.has(log.action)) {
          reviewedThisWeek.add(request.id);
        }
        if (log.createdAt >= startOfWeek && log.action === 'HR_FORWARDED_TO_ADMIN') {
          forwardedThisWeek.add(request.id);
        }
      }

      const isAwaitingHrReview =
        request.status === RecruitmentRequestStatus.PENDING_HR_REVIEW ||
        (request.status === RecruitmentRequestStatus.PENDING_REVIEW &&
          (!latestForward || latestForward < latestSubmission));
      if (isAwaitingHrReview) {
        oldestPendingDays = Math.max(
          oldestPendingDays,
          Math.max(0, (now.getTime() - latestSubmission.getTime()) / MS_PER_DAY),
        );
      }
    }

    const total = requests.length;
    return {
      averageReviewTimeDays:
        reviewDurations.length > 0
          ? Number(
              (
                reviewDurations.reduce((sum, duration) => sum + duration, 0) /
                reviewDurations.length
              ).toFixed(1),
            )
          : 0,
      oldestPendingDays: Math.floor(oldestPendingDays),
      reviewedThisWeek: reviewedThisWeek.size,
      forwardedThisWeek: forwardedThisWeek.size,
      distribution: [...distribution.entries()]
        .map(([department, count]) => ({
          department,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort(
          (left, right) =>
            right.count - left.count || left.department.localeCompare(right.department),
        ),
    };
  }

  async getHrDashboard() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const approvedStatuses = new Set<string>([
      RecruitmentRequestStatus.APPROVED,
      RecruitmentRequestStatus.PLANNING,
      RecruitmentRequestStatus.PLAN_PENDING_APPROVAL,
      RecruitmentRequestStatus.PLAN_APPROVED,
      RecruitmentRequestStatus.ACTIVE,
      RecruitmentRequestStatus.SCREENING,
      RecruitmentRequestStatus.INTERVIEWING,
      RecruitmentRequestStatus.INTERVIEW_COMPLETED,
      RecruitmentRequestStatus.DECISION_PENDING,
      RecruitmentRequestStatus.OFFER_EXTENDED,
      RecruitmentRequestStatus.OFFER_ACCEPTED,
      RecruitmentRequestStatus.OFFER_DECLINED,
      RecruitmentRequestStatus.HIRED,
      RecruitmentRequestStatus.NOT_HIRED,
      RecruitmentRequestStatus.COMPLETED,
      RecruitmentRequestStatus.CLOSED,
    ]);
    const terminalRequestStatuses = new Set<string>([
      RecruitmentRequestStatus.COMPLETED,
      RecruitmentRequestStatus.CLOSED,
      RecruitmentRequestStatus.CANCELLED,
      RecruitmentRequestStatus.REJECTED,
    ]);
    const terminalApplicationStatuses = new Set<string>([
      RecruitmentRequestStatus.REJECTED,
      RecruitmentRequestStatus.NOT_HIRED,
      RecruitmentRequestStatus.OFFER_DECLINED,
      RecruitmentRequestStatus.OFFER_ACCEPTED,
      RecruitmentRequestStatus.HIRED,
    ]);
    const attentionByStatus: Record<string, string> = {
      PENDING_HR_REVIEW: 'needs HR review',
      APPROVED: 'needs a recruitment plan',
      PLAN_PENDING_APPROVAL: 'has a plan awaiting approval',
      INTERVIEW_COMPLETED: 'needs a hiring decision',
      DECISION_PENDING: 'needs a hiring decision',
    };

    const [requests, upcomingSchedules, weekInterviews] = await Promise.all([
      this.prisma.recruitmentRequest.findMany({
        where: { status: { not: RecruitmentRequestStatus.DRAFT } },
        include: {
          department: { select: { name: true } },
          reviewedBy: { select: { displayName: true } },
          overallPlan: {
            select: {
              status: true,
              startDate: true,
              endDate: true,
              createdBy: { select: { displayName: true } },
              tasks: {
                orderBy: { startDate: 'asc' },
                select: {
                  id: true,
                  taskType: true,
                  status: true,
                  startDate: true,
                  endDate: true,
                  assignedTo: { select: { displayName: true } },
                },
              },
            },
          },
          applications: { select: { candidateId: true, status: true, updatedAt: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.interviewSchedule.findMany({
        where: {
          scheduledAt: { gte: now },
          status: { not: InterviewStatus.CANCELLED },
        },
        select: {
          id: true,
          scheduledAt: true,
          location: true,
          status: true,
          candidate: { select: { fullName: true } },
          request: { select: { position: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        take: 3,
      }),
      this.prisma.interviewSchedule.count({
        where: {
          scheduledAt: { gte: startOfWeek, lt: endOfWeek },
          status: { not: InterviewStatus.CANCELLED },
        },
      }),
    ]);

    const activeRequests = requests.filter(
      (request) =>
        request.overallPlan?.status === PlanStatus.APPROVED &&
        !terminalRequestStatuses.has(request.status),
    );
    const approvedRequests = requests.filter((request) => approvedStatuses.has(request.status));
    const candidateIds = new Set(
      activeRequests.flatMap((request) =>
        request.applications
          .filter((application) => !terminalApplicationStatuses.has(application.status))
          .map((application) => application.candidateId),
      ),
    );
    const interviewMilestones = activeRequests
      .flatMap((request) =>
        (request.overallPlan?.tasks ?? [])
          .filter(
            (task) =>
              task.taskType === TaskType.INTERVIEW_COORDINATION &&
              task.status !== TaskStatus.COMPLETED &&
              !!task.endDate &&
              task.endDate >= now,
          )
          .map((task) => ({
            id: task.id,
            position: request.position,
            startDate: task.startDate,
            endDate: task.endDate,
            status: task.status,
            owner: task.assignedTo.displayName,
          })),
      )
      .sort(
        (left, right) =>
          (left.startDate?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (right.startDate?.getTime() ?? Number.MAX_SAFE_INTEGER),
      );
    const interviewStagesThisWeek = interviewMilestones.filter(
      (milestone) =>
        !!milestone.startDate &&
        !!milestone.endDate &&
        milestone.startDate < endOfWeek &&
        milestone.endDate >= startOfWeek,
    ).length;
    const pipelineCounts = {
      Applied: 0,
      Screened: 0,
      Interview: 0,
      Final: 0,
      Offer: 0,
    };
    const successfulOutcomes: Date[] = [];
    let resolvedOutcomes = 0;
    let totalHiringDays = 0;

    for (const request of requests) {
      for (const application of request.applications) {
        if (application.status === 'SUBMITTED') pipelineCounts.Applied += 1;
        else if (['SCREENING', 'SHORTLISTED'].includes(application.status)) {
          pipelineCounts.Screened += 1;
        } else if (application.status === RecruitmentRequestStatus.INTERVIEWING) {
          pipelineCounts.Interview += 1;
        } else if (
          [
            RecruitmentRequestStatus.INTERVIEW_COMPLETED,
            RecruitmentRequestStatus.DECISION_PENDING,
          ].includes(application.status as RecruitmentRequestStatus)
        ) {
          pipelineCounts.Final += 1;
        } else if (
          [
            RecruitmentRequestStatus.OFFER_EXTENDED,
            RecruitmentRequestStatus.OFFER_ACCEPTED,
            RecruitmentRequestStatus.OFFER_DECLINED,
            RecruitmentRequestStatus.HIRED,
          ].includes(application.status as RecruitmentRequestStatus)
        ) {
          pipelineCounts.Offer += 1;
        }

        if (
          [
            RecruitmentRequestStatus.OFFER_ACCEPTED,
            RecruitmentRequestStatus.HIRED,
            RecruitmentRequestStatus.REJECTED,
            RecruitmentRequestStatus.NOT_HIRED,
            RecruitmentRequestStatus.OFFER_DECLINED,
          ].includes(application.status as RecruitmentRequestStatus)
        ) {
          resolvedOutcomes += 1;
          if (
            [RecruitmentRequestStatus.OFFER_ACCEPTED, RecruitmentRequestStatus.HIRED].includes(
              application.status as RecruitmentRequestStatus,
            )
          ) {
            successfulOutcomes.push(application.updatedAt);
            totalHiringDays +=
              (application.updatedAt.getTime() - request.createdAt.getTime()) / MS_PER_DAY;
          }
        }
      }
    }

    return {
      kpis: {
        approvedRequests: approvedRequests.length,
        activePlans: activeRequests.length,
        activeDepartments: new Set(
          activeRequests.map((request) => request.department?.name ?? 'Unassigned'),
        ).size,
        interviewsThisWeek: weekInterviews,
        interviewStagesThisWeek,
        nextInterviewStageAt: interviewMilestones[0]?.startDate?.toISOString() ?? null,
        candidatesInPipeline: candidateIds.size,
        candidatesInFinalReview: pipelineCounts.Final,
      },
      plans: activeRequests.map((request) => {
        const tasks = request.overallPlan?.tasks ?? [];
        const currentTask =
          tasks.find((task) => task.status === TaskStatus.IN_PROGRESS) ??
          tasks.find(
            (task) =>
              task.status !== TaskStatus.COMPLETED &&
              !!task.startDate &&
              !!task.endDate &&
              task.startDate <= now &&
              task.endDate >= now,
          ) ??
          tasks.find((task) => task.status !== TaskStatus.COMPLETED);
        const phase = [
          RecruitmentRequestStatus.OFFER_EXTENDED,
          RecruitmentRequestStatus.OFFER_ACCEPTED,
          RecruitmentRequestStatus.OFFER_DECLINED,
          RecruitmentRequestStatus.HIRED,
        ].includes(request.status as RecruitmentRequestStatus)
          ? 'Offer Prep'
          : [
                RecruitmentRequestStatus.INTERVIEW_COMPLETED,
                RecruitmentRequestStatus.DECISION_PENDING,
                RecruitmentRequestStatus.NOT_HIRED,
              ].includes(request.status as RecruitmentRequestStatus) ||
              currentTask?.taskType === TaskType.HIRING
            ? 'Final Review'
            : request.status === RecruitmentRequestStatus.INTERVIEWING ||
                currentTask?.taskType === TaskType.INTERVIEW_COORDINATION
              ? 'Interview'
              : 'CV Screening';

        return {
          id: request.id,
          position: request.position,
          department: request.department?.name ?? 'Unassigned',
          status: request.status,
          phase,
          progress:
            tasks.length > 0
              ? Math.round(
                  (tasks.filter((task) => task.status === 'COMPLETED').length / tasks.length) * 100,
                )
              : 0,
          deadline: request.overallPlan?.endDate?.toISOString() ?? null,
          owner:
            request.overallPlan?.createdBy.displayName ??
            request.reviewedBy?.displayName ??
            'Unassigned',
        };
      }),
      upcomingInterviews: upcomingSchedules.map((schedule) => ({
        id: schedule.id,
        scheduledAt: schedule.scheduledAt.toISOString(),
        candidate: schedule.candidate.fullName,
        position: schedule.request.position,
        location: schedule.location,
      })),
      upcomingInterviewMilestones: interviewMilestones.slice(0, 3).map((milestone) => ({
        id: milestone.id,
        scheduledAt: milestone.startDate?.toISOString() ?? milestone.endDate!.toISOString(),
        position: milestone.position,
        owner: milestone.owner,
        status: milestone.status,
      })),
      pipeline: Object.entries(pipelineCounts).map(([label, value]) => ({ label, value })),
      metrics: {
        hiringVelocityDays:
          successfulOutcomes.length > 0
            ? Number((totalHiringDays / successfulOutcomes.length).toFixed(1))
            : null,
        passRate:
          resolvedOutcomes > 0
            ? Math.round((successfulOutcomes.length / resolvedOutcomes) * 100)
            : null,
      },
      attentionItems: [
        ...requests
          .filter((request) => attentionByStatus[request.status])
          .map((request) => ({
            id: request.id,
            message: `${request.position} ${attentionByStatus[request.status]}`,
          })),
        ...activeRequests.flatMap((request) =>
          (request.overallPlan?.tasks ?? [])
            .filter(
              (task) =>
                task.status !== TaskStatus.COMPLETED && !!task.endDate && task.endDate < now,
            )
            .map((task) => ({
              id: task.id,
              message: `${request.position} has an overdue ${task.taskType.toLowerCase().replaceAll('_', ' ')} task`,
            })),
        ),
      ].slice(0, 3),
    };
  }

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
        offers: true,
        reviewedBy: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
    });

    const totalRequests = requests.length;
    const totalPositionsOpened = requests.reduce((sum, request) => sum + request.headcount, 0);
    const completedHires = requests
      .filter((r) => r.status === 'CLOSED' || r.status === 'OFFER_ACCEPTED')
      .reduce(
        (sum, r) => sum + r.applications.filter((a) => a.status === 'OFFER_ACCEPTED').length,
        0,
      );

    const monthlyRequests = Array(12).fill(0);
    const monthlyFilled = Array(12).fill(0);
    for (const req of requests) {
      const month = new Date(req.createdAt).getMonth();
      monthlyRequests[month]++;
      for (const application of req.applications) {
        if (
          application.status === 'OFFER_ACCEPTED' &&
          application.updatedAt >= startOfYear &&
          application.updatedAt <= endOfYear
        ) {
          monthlyFilled[application.updatedAt.getMonth()]++;
        }
      }
    }

    const completedRequests = requests.filter(
      (request) => request.status === 'CLOSED' || request.status === 'OFFER_ACCEPTED',
    );
    const averageTimeToHireDays =
      completedRequests.length > 0
        ? Number(
            (
              completedRequests.reduce(
                (sum, request) => sum + (request.updatedAt.getTime() - request.createdAt.getTime()),
                0,
              ) /
              completedRequests.length /
              (1000 * 60 * 60 * 24)
            ).toFixed(2),
          )
        : 0;

    const offers = requests.flatMap((request) => request.offers);
    const respondedOffers = offers.filter((offer) =>
      ['ACCEPTED', 'DECLINED'].includes(offer.status),
    );
    const acceptedOffers = respondedOffers.filter((offer) => offer.status === 'ACCEPTED').length;
    const offerAcceptanceRate =
      respondedOffers.length > 0
        ? Number(((acceptedOffers / respondedOffers.length) * 100).toFixed(2))
        : 0;

    const parseCompensation = (value: string | null | undefined) => {
      if (!value) return 0;
      const digits = value.replace(/\D/g, '');
      if (!digits) return 0;
      const parsed = Number(digits);
      return parsed < 100000 ? parsed * 1000000 : parsed;
    };
    const acceptedCandidateIds = new Set(
      requests.flatMap((request) =>
        request.applications
          .filter((application) => application.status === 'OFFER_ACCEPTED')
          .map((application) => application.candidateId),
      ),
    );
    const totalHiringCost = offers
      .filter((offer) => acceptedCandidateIds.has(offer.candidateId))
      .reduce((sum, offer) => sum + 15000000 + parseCompensation(offer.compensation) * 0.1, 0);
    const costPerHire =
      completedHires > 0 ? Number((totalHiringCost / completedHires).toFixed(2)) : 0;

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
      .reduce(
        (sum, r) => sum + r.applications.filter((a) => a.status === 'OFFER_ACCEPTED').length,
        0,
      );

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
    const deptMap = new Map<
      string,
      {
        departmentId: string;
        departmentName: string;
        departmentCode: string;
        totalRequests: number;
        targetHeadcount: number;
        totalFilled: number;
      }
    >();

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
      const fillRate =
        dept.targetHeadcount > 0
          ? Number(((dept.totalFilled / dept.targetHeadcount) * 100).toFixed(2))
          : 0;
      return {
        ...dept,
        fillRate,
      };
    });

    const managerMap = new Map<
      string,
      {
        id: string;
        name: string;
        requests: number;
        filled: number;
        target: number;
        processingDays: number;
      }
    >();
    for (const request of requests) {
      if (!request.reviewedBy) continue;
      const manager = managerMap.get(request.reviewedBy.id) ?? {
        id: request.reviewedBy.id,
        name: request.reviewedBy.displayName,
        requests: 0,
        filled: 0,
        target: 0,
        processingDays: 0,
      };
      manager.requests++;
      manager.target += request.headcount;
      manager.filled += request.applications.filter(
        (application) => application.status === 'OFFER_ACCEPTED',
      ).length;
      manager.processingDays +=
        (request.updatedAt.getTime() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      managerMap.set(manager.id, manager);
    }
    const managerPerformance = Array.from(managerMap.values()).map((manager) => ({
      id: manager.id,
      name: manager.name,
      requests: manager.requests,
      averageProcessingDays: Number((manager.processingDays / manager.requests).toFixed(2)),
      fillRate:
        manager.target > 0 ? Number(((manager.filled / manager.target) * 100).toFixed(2)) : 0,
    }));

    const completedRequestIds = completedRequests.map((request) => request.id);
    const logs =
      completedRequestIds.length > 0
        ? await this.prisma.requestLog.findMany({
            where: { requestId: { in: completedRequestIds } },
            orderBy: { createdAt: 'asc' },
          })
        : [];
    const stageTotals: Record<string, number> = {};
    const stageCounts: Record<string, number> = {};
    const stageForStatus = (status: string | null) => {
      if (status === 'INTERVIEWING') return 'Interview';
      if (status === 'INTERVIEW_COMPLETED') return 'Decision';
      if (status === 'OFFER_EXTENDED') return 'Offer Process';
      if (status === 'OFFER_ACCEPTED') return 'Onboarding Prep';
      return 'Screening';
    };
    for (const request of completedRequests) {
      const requestLogs = logs.filter((log) => log.requestId === request.id);
      const timeline = [
        { status: 'DRAFT', time: request.createdAt.getTime() },
        ...requestLogs.map((log) => ({
          status: log.toStatus || log.fromStatus || 'DRAFT',
          time: log.createdAt.getTime(),
        })),
        { status: request.status, time: request.updatedAt.getTime() },
      ].sort((a, b) => a.time - b.time);
      for (let index = 0; index < timeline.length - 1; index++) {
        const current = timeline[index];
        const next = timeline[index + 1];
        if (!current || !next || next.time <= current.time) continue;
        const stage = stageForStatus(current.status);
        stageTotals[stage] = (stageTotals[stage] || 0) + next.time - current.time;
        stageCounts[stage] = (stageCounts[stage] || 0) + 1;
      }
    }
    const timeToHireByStage = [
      'Screening',
      'Interview',
      'Decision',
      'Offer Process',
      'Onboarding Prep',
    ].map((stage) => ({
      stage,
      days:
        (stageCounts[stage] ?? 0) > 0
          ? Number(
              (
                (stageTotals[stage] ?? 0) /
                (stageCounts[stage] ?? 1) /
                (1000 * 60 * 60 * 24)
              ).toFixed(2),
            )
          : 0,
    }));

    return {
      year,
      summary: {
        totalRequests,
        totalPositionsOpened,
        totalInterviews,
        completedHires,
        monthlyRequests,
        monthlyFilled,
        averageTimeToHireDays,
        offerAcceptanceRate,
        costPerHire,
      },
      yoyComparison,
      departmentBreakdown,
      managerPerformance,
      timeToHireByStage,
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
    csvLines.push(
      `${report.summary.totalRequests},${report.summary.totalInterviews},${report.summary.completedHires}`,
    );
    csvLines.push('');

    csvLines.push(`YEAR-OVER-YEAR COMPARISON (vs ${report.yoyComparison.previousYear})`);
    csvLines.push('Metric,Current Year,Previous Year,Growth %');
    csvLines.push(
      `Requests,${report.yoyComparison.requests.current},${report.yoyComparison.requests.previous},${report.yoyComparison.requests.growthPercentage}%`,
    );
    csvLines.push(
      `Interviews,${report.yoyComparison.interviews.current},${report.yoyComparison.interviews.previous},${report.yoyComparison.interviews.growthPercentage}%`,
    );
    csvLines.push(
      `Completed Hires,${report.yoyComparison.completedHires.current},${report.yoyComparison.completedHires.previous},${report.yoyComparison.completedHires.growthPercentage}%`,
    );
    csvLines.push('');

    csvLines.push('DEPARTMENT BREAKDOWN');
    csvLines.push('Department,Code,Total Requests,Target Headcount,Total Filled,Fill Rate %');
    for (const dept of report.departmentBreakdown) {
      csvLines.push(
        `"${dept.departmentName.replace(/"/g, '""')}",${dept.departmentCode},${dept.totalRequests},${dept.targetHeadcount},${dept.totalFilled},${dept.fillRate}%`,
      );
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
      doc
        .fontSize(14)
        .text(`2. Year-over-Year Comparison (vs ${report.yoyComparison.previousYear})`, {
          underline: true,
        });
      doc.moveDown(0.5);
      doc
        .fontSize(12)
        .text(
          `Requests: ${report.yoyComparison.requests.current} (Current) vs ${report.yoyComparison.requests.previous} (Previous) | Growth: ${report.yoyComparison.requests.growthPercentage}%`,
        );
      doc.text(
        `Interviews: ${report.yoyComparison.interviews.current} (Current) vs ${report.yoyComparison.interviews.previous} (Previous) | Growth: ${report.yoyComparison.interviews.growthPercentage}%`,
      );
      doc.text(
        `Completed Hires: ${report.yoyComparison.completedHires.current} (Current) vs ${report.yoyComparison.completedHires.previous} (Previous) | Growth: ${report.yoyComparison.completedHires.growthPercentage}%`,
      );
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

  async getRealtimeTracking(payload: { userId: string; role: string; departmentId?: string }) {
    const { userId, role } = payload;
    if (role === UserRole.CANDIDATE) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'Candidates cannot access recruitment tracking',
      });
    }

    const where: any = {};
    if (role === UserRole.DEPARTMENT_HEAD) {
      const actor = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { departmentId: true },
      });
      const departmentId = payload.departmentId ?? actor?.departmentId;
      where.OR = [{ createdById: userId }, ...(departmentId ? [{ departmentId }] : [])];
    } else if (isHrRole(role)) {
      where.OR = [
        { status: { not: RecruitmentRequestStatus.DRAFT } },
        { reviewedById: userId },
        { overallPlan: { tasks: { some: { assignedToId: userId } } } },
        { interviews: { some: { interviewers: { has: userId } } } },
      ];
    } else if (role !== UserRole.ADMIN) {
      throw new RpcException({ status: HttpStatus.FORBIDDEN, message: 'Role is not allowed' });
    }

    const requests = await this.prisma.recruitmentRequest.findMany({
      where,
      include: {
        createdBy: { select: { id: true, displayName: true, role: true } },
        reviewedBy: { select: { id: true, displayName: true, role: true } },
        approvedBy: { select: { id: true, displayName: true, role: true } },
        department: { select: { id: true, name: true } },
        overallPlan: {
          include: {
            tasks: {
              include: {
                assignedTo: { select: { id: true, displayName: true, role: true, email: true } },
              },
            },
          },
        },
        interviews: { include: { results: true } },
        applications: true,
        offers: true,
        logs: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const pendingActions: Record<string, string> = {
      DRAFT: 'SUBMIT_REQUEST',
      PENDING_HR_REVIEW: 'HR_REVIEW',
      PENDING_BOSS_APPROVAL: 'ADMIN_APPROVAL',
      APPROVED: 'CREATE_PLAN',
      PLANNING: 'SUBMIT_PLAN',
      PLAN_PENDING_APPROVAL: 'PLAN_APPROVAL',
      ACTIVE: 'SOURCE_OR_SCREEN_CANDIDATES',
      INTERVIEWING: 'INTERVIEW_RESULT',
      INTERVIEW_COMPLETED: 'HIRING_DECISION',
      DECISION_PENDING: 'HIRING_DECISION',
      OFFER_EXTENDED: 'OFFER_RESPONSE',
      OFFER_ACCEPTED: 'COMPLETE_HIRING',
      NOT_HIRED: 'CONTINUE_OR_CLOSE',
      COMPLETED: 'NONE',
    };

    const ownerFor = (status: string): string => {
      if (['DRAFT', 'REVISION_NEEDED'].includes(status)) return UserRole.DEPARTMENT_HEAD;
      if (['PENDING_HR_REVIEW', 'APPROVED', 'PLANNING', 'PLAN_PENDING_APPROVAL'].includes(status)) {
        return UserRole.HR_LEADER;
      }
      if (['PENDING_BOSS_APPROVAL', 'DECISION_PENDING', 'INTERVIEW_COMPLETED'].includes(status)) {
        return UserRole.ADMIN;
      }
      if (['OFFER_EXTENDED'].includes(status)) return UserRole.CANDIDATE;
      if (['ACTIVE', 'SCREENING', 'INTERVIEWING'].includes(status)) return UserRole.HR_LEADER;
      return 'SYSTEM';
    };

    const now = Date.now();
    const isTaskOverdue = (task: { status: string; endDate: Date | null }) =>
      task.status !== 'COMPLETED' && !!task.endDate && task.endDate.getTime() < now;

    return requests.map((request) => {
      const tasks = request.overallPlan?.tasks ?? [];
      const latestLog = request.logs[0];
      const hiredCount = request.applications.filter((application) =>
        ['OFFER_ACCEPTED', 'HIRED'].includes(application.status),
      ).length;
      const item = {
        requestId: request.id,
        position: request.position,
        // Legacy/imported requests can exist without a department relation. Keep the
        // tracking feed available for all other requests instead of failing the whole page.
        departmentId: request.department?.id ?? null,
        departmentName: request.department?.name ?? 'Unassigned',
        status: request.status,
        urgency: request.urgency,
        currentOwner: ownerFor(request.status),
        pendingAction: pendingActions[request.status] ?? 'NONE',
        headcount: request.headcount,
        hiredCount,
        applicationCount: request.applications.length,
        interviewedCandidateCount: new Set(
          request.interviews.map((interview) => interview.candidateId),
        ).size,
        taskProgress: {
          total: tasks.length,
          completed: tasks.filter((task) => task.status === 'COMPLETED').length,
          overdue: tasks.filter(isTaskOverdue).length,
        },
        taskBreakdown: tasks.map((task) => ({
          id: task.id,
          taskType: task.taskType,
          status: task.status,
          startDate: task.startDate?.toISOString() ?? null,
          endDate: task.endDate?.toISOString() ?? null,
          isOverdue: isTaskOverdue(task),
          assignedTo: task.assignedTo
            ? {
                id: task.assignedTo.id,
                displayName: task.assignedTo.displayName,
                role: task.assignedTo.role,
                email: task.assignedTo.email,
              }
            : null,
        })),
        interviewProgress: {
          scheduled: request.interviews.filter((interview) =>
            ['SCHEDULED', 'RESCHEDULED', 'CONFIRMED'].includes(interview.status),
          ).length,
          completed: request.interviews.filter((interview) => interview.status === 'COMPLETED')
            .length,
          cancelled: request.interviews.filter((interview) => interview.status === 'CANCELLED')
            .length,
        },
        offerProgress: {
          sent: request.offers.filter((offer) => offer.status === 'SENT').length,
          accepted: request.offers.filter((offer) => offer.status === 'ACCEPTED').length,
          declined: request.offers.filter((offer) => offer.status === 'DECLINED').length,
        },
        latestLog: latestLog
          ? {
              action: latestLog.action,
              at: latestLog.createdAt.toISOString(),
              performedById: latestLog.performedById,
            }
          : undefined,
        lastUpdatedAt: request.updatedAt.toISOString(),
      };

      return {
        ...item,
        // Backward-compatible aliases for dashboards still on the old response shape.
        id: item.requestId,
        department: item.departmentName,
        targetHeadcount: item.headcount,
        filledHeadcount: item.hiredCount,
        createdBy: request.createdBy?.displayName ?? 'Unknown',
        handler: request.reviewedBy?.displayName ?? 'Not Assigned',
        rejectionReason: request.rejectionReason,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      };
    });
  }

  async getAdminDashboard() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const terminalStatuses = ['CLOSED', 'CANCELLED', 'REJECTED'];
    const [requests, interviewsThisWeek, applicationGroups, recentLogs, acceptedApplications] =
      await Promise.all([
        this.prisma.recruitmentRequest.findMany({
          include: {
            department: {
              select: { id: true, name: true, code: true },
            },
            createdBy: {
              select: { displayName: true },
            },
            reviewedBy: {
              select: { displayName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.interviewSchedule.count({
          where: {
            scheduledAt: {
              gte: startOfWeek,
              lt: endOfWeek,
            },
          },
        }),
        this.prisma.application.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        this.prisma.requestLog.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            request: {
              select: { id: true, position: true },
            },
            performedBy: {
              select: { displayName: true },
            },
          },
        }),
        this.prisma.application.count({
          where: {
            status: 'OFFER_ACCEPTED',
            updatedAt: { gte: startOfYear },
          },
        }),
      ]);

    const activeRequests = requests.filter((request) => !terminalStatuses.includes(request.status));
    const pendingRequests = requests.filter((request) => request.status === 'PENDING_REVIEW');
    const yearlyRequests = requests.filter((request) => request.createdAt >= startOfYear);
    const targetHeadcount = yearlyRequests.reduce((sum, request) => sum + request.headcount, 0);

    const departmentMap = new Map<string, { id: string; label: string; value: number }>();
    for (const request of activeRequests) {
      const current = departmentMap.get(request.department.id) ?? {
        id: request.department.id,
        label: request.department.code || request.department.name,
        value: 0,
      };
      current.value += 1;
      departmentMap.set(request.department.id, current);
    }

    const applicationBreakdown = Object.fromEntries(
      applicationGroups.map((group) => [group.status, group._count._all]),
    );

    return {
      generatedAt: now,
      kpis: {
        activeRequests: activeRequests.length,
        pendingApproval: pendingRequests.length,
        interviewsThisWeek,
        positionsFilled: acceptedApplications,
        targetHeadcount,
      },
      approvalQueue: pendingRequests.slice(0, 5).map((request) => ({
        id: request.id,
        position: request.position,
        department: request.department.code || request.department.name,
        priority: request.urgency,
        submittedAt: request.createdAt,
      })),
      pipeline: [
        { label: 'Applied', value: applicationBreakdown.SUBMITTED ?? 0 },
        { label: 'Screening', value: applicationBreakdown.SCREENING ?? 0 },
        { label: 'Interview', value: applicationBreakdown.INTERVIEWING ?? 0 },
        { label: 'Offer', value: applicationBreakdown.OFFER_EXTENDED ?? 0 },
        { label: 'Hired', value: applicationBreakdown.OFFER_ACCEPTED ?? 0 },
      ],
      departmentActivity: Array.from(departmentMap.values()).sort((a, b) => b.value - a.value),
      recentActivity: recentLogs.map((log) => ({
        id: log.id,
        requestId: log.request.id,
        position: log.request.position,
        action: log.action,
        actor: log.performedBy.displayName,
        fromStatus: log.fromStatus,
        toStatus: log.toStatus,
        createdAt: log.createdAt,
      })),
    };
  }

  async getDepartmentStats(payload: { range?: '30d' | 'quarter' | 'year' }) {
    const range = payload.range || '30d';
    const now = new Date();
    let startDate: Date;
    if (range === 'quarter') {
      startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    } else if (range === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    }

    const departments = await this.prisma.department.findMany({
      include: {
        headUser: {
          select: {
            displayName: true,
            updatedAt: true,
          },
        },
        requests: {
          where: {
            createdAt: { gte: startDate },
          },
          include: {
            applications: {
              select: {
                status: true,
              },
            },
            interviews: {
              select: {
                candidateId: true,
              },
            },
            overallPlan: {
              select: {
                status: true,
                createdAt: true,
                tasks: {
                  select: {
                    taskType: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const inactiveStatuses = ['CLOSED', 'CANCELLED', 'REJECTED'];
    const finishedApplicationStatuses = ['OFFER_ACCEPTED', 'REJECTED'];
    const relativeTime = (date: Date) => {
      const hours = Math.max(0, Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60)));
      if (hours < 1) return 'Active';
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    };

    const rows = departments.map((department, index) => {
      const requested = department.requests.reduce((sum, request) => sum + request.headcount, 0);
      const filled = department.requests.reduce(
        (sum, request) =>
          sum +
          request.applications.filter((application) => application.status === 'OFFER_ACCEPTED')
            .length,
        0,
      );
      const inProgress = department.requests.reduce(
        (sum, request) =>
          sum +
          request.applications.filter(
            (application) => !finishedApplicationStatuses.includes(application.status),
          ).length,
        0,
      );
      const pendingHrRequests = department.requests.filter((request) =>
        ['PENDING_HR_REVIEW', 'PENDING_REVIEW'].includes(request.status),
      );
      const pendingAdminRequests = department.requests.filter(
        (request) => request.status === 'PENDING_BOSS_APPROVAL',
      );
      const pendingPlans = department.requests.filter(
        (request) => request.overallPlan?.status === 'PENDING_APPROVAL',
      );
      const pendingRequestCount = pendingHrRequests.length + pendingAdminRequests.length;
      const pendingPlanCount = pendingPlans.length;
      const completed = department.requests.filter((request) =>
        ['CLOSED', 'OFFER_ACCEPTED'].includes(request.status),
      );
      const timeToHire =
        completed.length > 0
          ? Number(
              (
                completed.reduce(
                  (sum, request) =>
                    sum + (request.updatedAt.getTime() - request.createdAt.getTime()),
                  0,
                ) /
                completed.length /
                (1000 * 60 * 60 * 24)
              ).toFixed(1),
            )
          : 0;
      const fillRate = requested > 0 ? Math.round((filled / requested) * 100) : 0;
      const pendingCreatedAt = [
        ...pendingHrRequests.map((request) => request.createdAt),
        ...pendingAdminRequests.map((request) => request.createdAt),
        ...pendingPlans.map((request) => request.overallPlan?.createdAt).filter(Boolean),
      ] as Date[];
      const oldestPendingDays = pendingCreatedAt.length
        ? Math.max(
            ...pendingCreatedAt.map((createdAt) =>
              Math.max(
                0,
                Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)),
              ),
            ),
          )
        : 0;
      const headName = department.headUser?.displayName || 'Not assigned';
      const initials =
        headName === 'Not assigned'
          ? 'NA'
          : headName
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

      return {
        card: {
          name: department.name,
          head: headName,
          fillRate,
          timeToHire,
          activeRequests: department.requests.filter(
            (request) => !inactiveStatuses.includes(request.status),
          ).length,
          pendingApprovalsText: `${pendingRequestCount + pendingPlanCount} Pending Approval${pendingRequestCount + pendingPlanCount === 1 ? '' : 's'}`,
          pendingApproved: pendingRequestCount + pendingPlanCount === 0,
        },
        chart: {
          label: department.code || department.name,
          requested,
          inProgress,
          filled,
        },
        pending: {
          department: department.name,
          hrReview: pendingHrRequests.length,
          adminReview: pendingAdminRequests.length,
          plans: pendingPlanCount,
          total: pendingRequestCount + pendingPlanCount,
          oldest: `${oldestPendingDays} day${oldestPendingDays === 1 ? '' : 's'}`,
          badge: oldestPendingDays >= 5,
        },
        activity: {
          name: headName,
          initials,
          dept: department.name,
          reqs: department.requests.length,
          score: Number(Math.min(5, fillRate / 20).toFixed(1)),
          lastActive: relativeTime(department.headUser?.updatedAt || department.updatedAt),
          avatarBg: ['bg-primary-container', 'bg-secondary', 'bg-teal-command', 'bg-slate-ink'][
            index % 4
          ],
        },
      };
    });

    return {
      range,
      generatedAt: now,
      cards: rows.map((row) => row.card),
      chart: rows.map((row) => row.chart),
      campaigns: departments.flatMap((department) =>
        department.requests
          .filter((request) => request.overallPlan)
          .map((request) => {
            const tasks = request.overallPlan?.tasks ?? [];
            const completedTasks = tasks.filter((task) => task.status === 'COMPLETED').length;
            const inProgressTasks = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
            const collectedCVs = request.applications.length;
            // Every application collected into this campaign (including from Talent Pool)
            // enters CV screening. Keep it counted after it progresses to interview or an
            // offer so the stage reports how many collected CVs were evaluated, not only
            // the small subset whose current status is literally SCREENING.
            const screeningCVs = collectedCVs;
            const hiredCount = request.applications.filter((application) =>
              ['OFFER_ACCEPTED', 'HIRED'].includes(application.status),
            ).length;
            const notHiredCount = request.applications.filter(
              (application) => application.status === 'NOT_HIRED',
            ).length;
            const interviewedCount = new Set(
              request.interviews.map((interview) => interview.candidateId),
            ).size;

            return {
              id: request.id,
              position: request.position,
              department: department.name,
              departmentCode: department.code || department.name,
              status: request.status,
              progress: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
              completedTasks,
              inProgressTasks,
              totalTasks: tasks.length,
              collectedCVs,
              screeningCVs,
              hiredCount,
              notHiredCount,
              interviewedCount,
              stages: tasks.map((task) => ({
                type: task.taskType,
                status: task.status,
              })),
            };
          }),
      ),
      pending: rows.map((row) => row.pending).filter((row) => row.total > 0),
      activity: rows.map((row) => row.activity).filter((row) => row.name !== 'Not assigned'),
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
    const totalHeadcount = requests.reduce(
      (sum: number, r: DepartmentRequestSummary) => sum + r.headcount,
      0,
    );

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
    const completedRequests: CompletedRequestSummary[] =
      await this.prisma.recruitmentRequest.findMany({
        where: {
          status: { in: ['CLOSED', 'OFFER_ACCEPTED', 'COMPLETED'] },
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

    const averageTimeToHireDays =
      totalTimeToHireMs / completedRequests.length / (1000 * 60 * 60 * 24);

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

      const fillRate =
        totalRequested > 0 ? Number(((totalFilled / totalRequested) * 100).toFixed(2)) : 0;
      const averageTimeToHireDays =
        timeToHireCount > 0 ? Number((totalTimeToHireDays / timeToHireCount).toFixed(2)) : 0;
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
