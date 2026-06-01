import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class OverallPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: {
    hiringRequestId: string;
    createdById: string;
    startDate: string; // ISO date string
    endDate: string;   // ISO date string
  }) {
    const { hiringRequestId, createdById, startDate, endDate } = payload;

    // Validate date ordering: endDate must be after startDate
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('startDate and endDate must be valid dates');
    }
    if (end <= start) {
      throw new BadRequestException('endDate must be after startDate');
    }

    // Load the hiring request
    const request = await this.prisma.hiringRequest.findUnique({
      where: { id: hiringRequestId },
    });
    if (!request) {
      throw new NotFoundException(`HiringRequest ${hiringRequestId} not found`);
    }

    // Validate: request must be APPROVED before a plan can be created
    if (request.status !== 'APPROVED') {
      throw new BadRequestException(
        `Cannot create a plan for a request in status "${request.status}". Request must be APPROVED.`,
      );
    }

    // Prevent duplicate plan for the same request
    const existing = await this.prisma.overallPlan.findUnique({
      where: { hiringRequestId },
    });
    if (existing) {
      throw new ConflictException(`An OverallPlan already exists for HiringRequest ${hiringRequestId}`);
    }

    // Atomic: create the plan + transition request to PLANNING
    const [plan] = await this.prisma.$transaction([
      this.prisma.overallPlan.create({
        data: {
          hiringRequestId,
          createdById,
          startDate: start,
          endDate: end,
          status: 'PENDING_APPROVAL',
        },
        include: {
          createdBy: { select: { id: true, displayName: true } },
          hiringRequest: { select: { id: true, title: true, status: true } },
        },
      }),
      this.prisma.hiringRequest.update({
        where: { id: hiringRequestId },
        data: { status: 'PLANNING' },
      }),
    ]);

    return plan;
  }

  async get(id: string) {
    const plan = await this.prisma.overallPlan.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        approvedBy: { select: { id: true, displayName: true } },
        hiringRequest: { select: { id: true, title: true, status: true } },
        taskPlans: {
          include: { assignedTo: { select: { id: true, displayName: true } } },
          orderBy: { startDate: 'asc' },
        },
      },
    });
    if (!plan) throw new NotFoundException(`OverallPlan ${id} not found`);
    return plan;
  }

  async getByRequest(hiringRequestId: string) {
    const plan = await this.prisma.overallPlan.findUnique({
      where: { hiringRequestId },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        approvedBy: { select: { id: true, displayName: true } },
        taskPlans: {
          include: { assignedTo: { select: { id: true, displayName: true } } },
          orderBy: { startDate: 'asc' },
        },
      },
    });
    if (!plan) throw new NotFoundException(`No OverallPlan found for HiringRequest ${hiringRequestId}`);
    return plan;
  }
}
