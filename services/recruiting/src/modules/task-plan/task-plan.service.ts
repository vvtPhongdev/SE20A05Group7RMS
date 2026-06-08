import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class TaskPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async list(overallPlanId: string) {
    const plan = await this.prisma.overallPlan.findUnique({ where: { id: overallPlanId } });
    if (!plan) throw new NotFoundException(`OverallPlan ${overallPlanId} not found`);

    return this.prisma.taskPlan.findMany({
      where: { overallPlanId },
      include: { assignedTo: { select: { id: true, displayName: true } } },
      orderBy: { startDate: 'asc' },
    });
  }

  async listByRequest(hiringRequestId: string) {
    const plan = await this.prisma.overallPlan.findUnique({
      where: { hiringRequestId },
    });
    if (!plan) {
      throw new NotFoundException(`No OverallPlan found for HiringRequest ${hiringRequestId}`);
    }
    return this.list(plan.id);
  }
}
