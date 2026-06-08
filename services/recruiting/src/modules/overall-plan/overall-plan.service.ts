import { Injectable, Inject, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationType } from '@wr/contracts';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class OverallPlanService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  async create(payload: {
    hiringRequestId: string;
    createdById: string;
    startDate: string; // ISO date string
    endDate: string;   // ISO date string
  }) {
    const { hiringRequestId, createdById, startDate, endDate } = payload;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('startDate and endDate must be valid dates');
    }
    if (end <= start) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: hiringRequestId },
    });
    if (!request) {
      throw new NotFoundException(`RecruitmentRequest ${hiringRequestId} not found`);
    }

    if (request.status !== 'APPROVED') {
      throw new BadRequestException(
        `Cannot create a plan for a request in status "${request.status}". Request must be APPROVED.`,
      );
    }

    const existing = await this.prisma.overallPlan.findUnique({
      where: { requestId: hiringRequestId },
    });
    if (existing) {
      throw new ConflictException(`An OverallPlan already exists for RecruitmentRequest ${hiringRequestId}`);
    }

    const [plan] = await this.prisma.$transaction([
      this.prisma.overallPlan.create({
        data: {
          requestId: hiringRequestId,
          createdById,
          startDate: start,
          endDate: end,
          status: 'PENDING_APPROVAL',
        },
        include: {
          createdBy: { select: { id: true, displayName: true } },
          request: { select: { id: true, position: true, status: true, createdById: true } },
        },
      }),
      this.prisma.recruitmentRequest.update({
        where: { id: hiringRequestId },
        data: { status: 'PLANNING' },
      }),
    ]);

    this.notificationClient.send('notification.create_notification', {
      userId: plan.request.createdById,
      type: NotificationType.REQUEST_UPDATE,
      title: 'Request status update: Planning',
      body: `Recruitment request for ${plan.request.position} has transitioned to Planning.`,
      relatedEntityId: hiringRequestId,
      relatedEntityType: 'RecruitmentRequest',
    }).subscribe({
      error: (err) => console.error('Failed to send dept head planning notification:', err),
    });

    this.notificationClient.send('notification.send_to_role', {
      role: 'HR_MANAGER',
      type: NotificationType.REQUEST_UPDATE,
      title: 'Request status update: Planning',
      body: `Recruitment request for ${plan.request.position} has transitioned to Planning.`,
      relatedEntityId: hiringRequestId,
      relatedEntityType: 'RecruitmentRequest',
    }).subscribe({
      error: (err) => console.error('Failed to send HR planning notification:', err),
    });

    return plan;
  }

  async get(id: string) {
    const plan = await this.prisma.overallPlan.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        approvedBy: { select: { id: true, displayName: true } },
        request: { select: { id: true, position: true, status: true } },
        tasks: {
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
      where: { requestId: hiringRequestId },
      include: {
        createdBy: { select: { id: true, displayName: true } },
        approvedBy: { select: { id: true, displayName: true } },
        tasks: {
          include: { assignedTo: { select: { id: true, displayName: true } } },
          orderBy: { startDate: 'asc' },
        },
      },
    });
    if (!plan) throw new NotFoundException(`No OverallPlan found for RecruitmentRequest ${hiringRequestId}`);
    return plan;
  }
}
