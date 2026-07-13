import { ReportsService } from './reports.service';

describe('ReportsService - T-087 Annual Reports & Tracking', () => {
  const prisma = {
    recruitmentRequest: {
      findMany: jest.fn(),
    },
    interviewSchedule: {
      count: jest.fn(),
    },
    requestLog: {
      findMany: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    department: { findMany: jest.fn() },
  };
  const service = new ReportsService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.interviewSchedule.count.mockResolvedValue(0);
    prisma.requestLog.findMany.mockResolvedValue([]);
    prisma.user.findUnique.mockResolvedValue({ departmentId: 'dept-1' });
  });

  describe('getAnnualReport', () => {
    it('generates annual report with YoY and department breakdown', async () => {
      // Mock findMany responses:
      // First call: current year requests (2026)
      // Second call: previous year requests (2025)
      prisma.recruitmentRequest.findMany
        .mockResolvedValueOnce([
          {
            id: 'req-1',
            department: { id: 'dept-1', name: 'Engineering', code: 'ENG' },
            headcount: 5,
            status: 'OFFER_ACCEPTED',
            createdAt: new Date('2026-03-01T00:00:00.000Z'),
            updatedAt: new Date('2026-04-01T00:00:00.000Z'),
            applications: [
              {
                status: 'OFFER_ACCEPTED',
                candidateId: 'c-1',
                updatedAt: new Date('2026-04-01T00:00:00.000Z'),
              },
            ],
            offers: [],
            reviewedBy: null,
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'req-2',
            department: { id: 'dept-1', name: 'Engineering', code: 'ENG' },
            headcount: 2,
            status: 'CLOSED',
            createdAt: new Date('2025-05-01T00:00:00.000Z'),
            updatedAt: new Date('2025-06-01T00:00:00.000Z'),
            applications: [{ status: 'OFFER_ACCEPTED', candidateId: 'c-2' }],
          },
        ]);
      prisma.interviewSchedule.count.mockResolvedValueOnce(5).mockResolvedValueOnce(2);

      const result = await service.getAnnualReport({ year: 2026 });

      expect(result.year).toBe(2026);
      expect(result.summary.totalRequests).toBe(1);
      expect(result.summary.completedHires).toBe(1);
      expect(result.yoyComparison.requests.current).toBe(1);
      expect(result.yoyComparison.requests.previous).toBe(1);
      expect(result.yoyComparison.requests.growthPercentage).toBe(0);
      expect(result.yoyComparison.interviews.current).toBe(5);
      expect(result.yoyComparison.interviews.previous).toBe(2);
      expect(result.yoyComparison.interviews.growthPercentage).toBe(150);
      expect(result.departmentBreakdown).toHaveLength(1);
      expect(result.departmentBreakdown[0]).toEqual({
        departmentId: 'dept-1',
        departmentName: 'Engineering',
        departmentCode: 'ENG',
        totalRequests: 1,
        targetHeadcount: 5,
        totalFilled: 1,
        fillRate: 20,
      });
    });
  });

  describe('getAnnualReportExport', () => {
    it('returns CSV format correctly', async () => {
      prisma.recruitmentRequest.findMany.mockResolvedValue([]);
      const result = await service.getAnnualReportExport({ year: 2026, format: 'csv' });
      expect(result.format).toBe('csv');
      expect(result.data).toContain('Annual Recruitment Report - 2026');
      expect(result.data).toContain('DEPARTMENT BREAKDOWN');
    });

    it('returns PDF format as base64', async () => {
      prisma.recruitmentRequest.findMany.mockResolvedValue([]);
      const result = await service.getAnnualReportExport({ year: 2026, format: 'pdf' });
      expect(result.format).toBe('pdf');
      expect(typeof result.data).toBe('string');
    });
  });

  describe('getRealtimeTracking', () => {
    it('filters requests by createdById for Department Head role', async () => {
      prisma.recruitmentRequest.findMany.mockResolvedValue([
        {
          id: 'req-1',
          position: 'Dev',
          headcount: 2,
          status: 'INTERVIEWING',
          department: { id: 'dept-1', name: 'Engineering' },
          createdBy: { id: 'user-1', displayName: 'Head', role: 'DEPARTMENT_HEAD' },
          reviewedBy: { displayName: 'HR Manager' },
          approvedBy: null,
          overallPlan: { tasks: [] },
          interviews: [],
          offers: [],
          logs: [],
          applications: [{ status: 'OFFER_ACCEPTED' }],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.getRealtimeTracking({
        userId: 'user-1',
        role: 'DEPARTMENT_HEAD',
      });

      expect(prisma.recruitmentRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ createdById: 'user-1' }, { departmentId: 'dept-1' }],
          },
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          position: 'Dev',
          departmentId: 'dept-1',
          targetHeadcount: 2,
          filledHeadcount: 1,
          status: 'INTERVIEWING',
          handler: 'HR Manager',
        }),
      );
    });

    it('returns all requests for Admin role', async () => {
      prisma.recruitmentRequest.findMany.mockResolvedValue([]);
      await service.getRealtimeTracking({
        userId: 'admin-1',
        role: 'ADMIN',
      });

      expect(prisma.recruitmentRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it('keeps unscheduled task dates nullable and excludes them from overdue count', async () => {
      prisma.recruitmentRequest.findMany.mockResolvedValue([
        {
          id: 'req-1',
          position: 'Dev',
          headcount: 2,
          status: 'ACTIVE',
          department: { id: 'dept-1', name: 'Engineering' },
          createdBy: { id: 'user-1', displayName: 'Head', role: 'DEPARTMENT_HEAD' },
          reviewedBy: null,
          approvedBy: null,
          overallPlan: {
            tasks: [
              {
                id: 'task-1',
                taskType: 'CV_COLLECTION',
                status: 'PENDING',
                startDate: null,
                endDate: null,
                assignedTo: null,
              },
              {
                id: 'task-2',
                taskType: 'CV_SCREENING',
                status: 'IN_PROGRESS',
                startDate: new Date('2026-06-01T00:00:00.000Z'),
                endDate: new Date('2026-06-02T00:00:00.000Z'),
                assignedTo: null,
              },
            ],
          },
          interviews: [],
          offers: [],
          logs: [],
          applications: [],
          createdAt: new Date('2026-06-01T00:00:00.000Z'),
          updatedAt: new Date('2026-06-03T00:00:00.000Z'),
        },
      ]);

      const result = await service.getRealtimeTracking({
        userId: 'admin-1',
        role: 'ADMIN',
      });

      expect(result[0]?.taskProgress).toEqual({ total: 2, completed: 0, overdue: 1 });
      expect(result[0]?.taskBreakdown?.[0]).toEqual(
        expect.objectContaining({
          startDate: null,
          endDate: null,
          isOverdue: false,
        }),
      );
      expect(result[0]?.taskBreakdown?.[1]).toEqual(
        expect.objectContaining({
          startDate: '2026-06-01T00:00:00.000Z',
          endDate: '2026-06-02T00:00:00.000Z',
          isOverdue: true,
        }),
      );
    });

    it('excludes unassigned DRAFT requests from HR Leader tracking', async () => {
      prisma.recruitmentRequest.findMany.mockResolvedValue([]);

      await service.getRealtimeTracking({ userId: 'leader-1', role: 'HR_LEADER' });

      expect(prisma.recruitmentRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { status: { not: 'DRAFT' } },
              { reviewedById: 'leader-1' },
              { overallPlan: { tasks: { some: { assignedToId: 'leader-1' } } } },
              { interviews: { some: { interviewers: { has: 'leader-1' } } } },
            ],
          },
        }),
      );
    });
  });

  describe('getDepartmentStats', () => {
    it('keeps Talent Pool CVs counted as screened after they progress', async () => {
      prisma.department.findMany.mockResolvedValue([
        {
          id: 'dept-1',
          name: 'Engineering',
          code: 'ENG',
          updatedAt: new Date('2026-07-01T00:00:00.000Z'),
          headUser: null,
          requests: [
            {
              id: 'request-1',
              position: 'Backend Developer',
              headcount: 1,
              status: 'PLAN_APPROVED',
              createdAt: new Date('2026-07-01T00:00:00.000Z'),
              updatedAt: new Date('2026-07-01T00:00:00.000Z'),
              applications: [
                { status: 'SUBMITTED' },
                { status: 'SCREENING' },
                { status: 'INTERVIEWING' },
              ],
              interviews: [],
              overallPlan: {
                status: 'APPROVED',
                createdAt: new Date('2026-07-01T00:00:00.000Z'),
                tasks: [{ taskType: 'CV_SCREENING', status: 'IN_PROGRESS' }],
              },
            },
          ],
        },
      ]);

      const result = await service.getDepartmentStats({ range: '30d' });

      expect(result.campaigns[0]).toEqual(
        expect.objectContaining({ collectedCVs: 3, screeningCVs: 3 }),
      );
    });
  });
});
