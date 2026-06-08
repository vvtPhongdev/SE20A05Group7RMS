import { ReportsService } from './reports.service';

describe('ReportsService - T-087 Annual Reports & Tracking', () => {
  const prisma = {
    recruitmentRequest: {
      findMany: jest.fn(),
    },
    interviewSchedule: {
      count: jest.fn(),
    },
  };
  const service = new ReportsService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.interviewSchedule.count.mockResolvedValue(0);
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
            applications: [
              { status: 'OFFER_ACCEPTED', candidateId: 'c-1' },
            ],
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 'req-2',
            department: { id: 'dept-1', name: 'Engineering', code: 'ENG' },
            headcount: 2,
            status: 'CLOSED',
            createdAt: new Date('2025-05-01T00:00:00.000Z'),
            applications: [
              { status: 'OFFER_ACCEPTED', candidateId: 'c-2' },
            ],
          },
        ]);
      prisma.interviewSchedule.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2);

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
          createdBy: { displayName: 'Head' },
          reviewedBy: { displayName: 'HR Manager' },
          applications: [
            { status: 'OFFER_ACCEPTED' },
          ],
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
          where: { createdById: 'user-1' },
        }),
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          position: 'Dev',
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
  });
});
