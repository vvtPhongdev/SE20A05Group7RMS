import { ReportsService } from './reports.service';

describe('ReportsService - getHiringMetrics', () => {
  const prisma = {
    recruitmentRequest: {
      findMany: jest.fn(),
    },
  };
  const service = new ReportsService(prisma as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('aggregates hiring metrics correctly by monthly period', async () => {
    prisma.recruitmentRequest.findMany.mockResolvedValue([
      {
        id: 'req-1',
        departmentId: 'dept-1',
        headcount: 3,
        status: 'OFFER_ACCEPTED',
        createdAt: new Date('2026-06-01T10:00:00.000Z'),
        updatedAt: new Date('2026-06-11T10:00:00.000Z'), // 10 days
        applications: [
          { status: 'OFFER_ACCEPTED', candidateId: 'candidate-1' },
          { status: 'OFFER_ACCEPTED', candidateId: 'candidate-2' },
          { status: 'SCREENING', candidateId: 'candidate-3' },
        ],
        offers: [
          { candidateId: 'candidate-1', compensation: '45,000,000 VND gross per month' },
          { candidateId: 'candidate-2', compensation: '35,000,000 VND gross per month' },
        ],
      },
      {
        id: 'req-2',
        departmentId: 'dept-1',
        headcount: 2,
        status: 'CLOSED',
        createdAt: new Date('2026-06-15T12:00:00.000Z'),
        updatedAt: new Date('2026-07-05T12:00:00.000Z'), // 20 days
        applications: [
          { status: 'OFFER_ACCEPTED', candidateId: 'candidate-4' },
        ],
        offers: [
          { candidateId: 'candidate-4', compensation: null }, // default 30M
        ],
      },
    ]);

    const result = await service.getHiringMetrics({
      departmentId: 'dept-1',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.000Z',
      period: 'monthly',
    });

    expect(prisma.recruitmentRequest.findMany).toHaveBeenCalledWith({
      where: {
        departmentId: 'dept-1',
        createdAt: {
          gte: new Date('2026-06-01T00:00:00.000Z'),
          lte: new Date('2026-06-30T23:59:59.000Z'),
        },
      },
      include: {
        applications: true,
        offers: true,
      },
    });

    // Check calculations:
    // Period: 2026-06
    // totalRequested = 3 + 2 = 5
    // totalFilled = 2 (req-1) + 1 (req-2) = 3
    // fillRate = (3 / 5) * 100 = 60
    //
    // Costs:
    // candidate-1: 15,000,000 + 4,500,000 (10% of 45M) = 19,500,000
    // candidate-2: 15,000,000 + 3,500,000 (10% of 35M) = 18,500,000
    // candidate-4: 15,000,000 + 3,000,000 (10% of 30M default) = 18,000,000
    // totalCost = 19,500,000 + 18,500,000 + 18,000,000 = 56,000,000
    // costPerHire = 56,000,000 / 3 = 18,666,666.67
    //
    // Time to hire:
    // req-1: 10 days
    // req-2: 20 days
    // averageTimeToHireDays = (10 + 20) / 2 = 15
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      period: '2026-06',
      totalRequested: 5,
      totalFilled: 3,
      fillRate: 60,
      averageTimeToHireDays: 15,
      totalCost: 56000000,
      costPerHire: 18666666.67,
    });
  });

  it('groups metrics by quarterly period', async () => {
    prisma.recruitmentRequest.findMany.mockResolvedValue([
      {
        id: 'req-1',
        departmentId: 'dept-1',
        headcount: 1,
        status: 'OPEN',
        createdAt: new Date('2026-02-15T00:00:00.000Z'),
        updatedAt: new Date('2026-02-15T00:00:00.000Z'),
        applications: [],
        offers: [],
      },
      {
        id: 'req-2',
        departmentId: 'dept-1',
        headcount: 2,
        status: 'CLOSED',
        createdAt: new Date('2026-05-10T00:00:00.000Z'),
        updatedAt: new Date('2026-05-20T00:00:00.000Z'), // 10 days
        applications: [
          { status: 'OFFER_ACCEPTED', candidateId: 'candidate-1' },
        ],
        offers: [
          { candidateId: 'candidate-1', compensation: '10,000,000 VND' },
        ],
      },
    ]);

    const result = await service.getHiringMetrics({
      period: 'quarterly',
    });

    // req-1 is Feb -> 2026-Q1
    // req-2 is May -> 2026-Q2
    expect(result).toHaveLength(2);
    const [q1, q2] = result;
    expect(q1).toBeDefined();
    expect(q2).toBeDefined();
    expect(q1!.period).toBe('2026-Q1');
    expect(q1!.totalRequested).toBe(1);
    expect(q2!.period).toBe('2026-Q2');
    expect(q2!.totalRequested).toBe(2);
    expect(q2!.totalFilled).toBe(1);
    expect(q2!.averageTimeToHireDays).toBe(10);
    // Cost: 15M + 1M (10% of 10M) = 16M
    expect(q2!.totalCost).toBe(16000000);
    expect(q2!.costPerHire).toBe(16000000);
  });
});
