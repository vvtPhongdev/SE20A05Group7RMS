import { HttpStatus, Injectable, Inject } from '@nestjs/common';
import { RpcException, ClientProxy } from '@nestjs/microservices';
import {
  EmailStatus,
  HiringDecision,
  InterviewResult,
  InterviewStatus,
  NotificationType,
  RecruitmentRequestStatus,
} from '@wr/contracts';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class HiringDecisionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  async decide(
    requestId: string,
    decision: HiringDecision,
    notes: string,
    adminId: string,
  ) {
    if (!Object.values(HiringDecision).includes(decision)) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'decision must be HIRE or REJECT',
      });
    }

    if (!notes?.trim()) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Decision notes are required',
      });
    }

    if (!adminId) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Admin identity is required',
      });
    }

    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: requestId },
      include: {
        interviews: {
          where: { status: { not: InterviewStatus.CANCELLED } },
          include: { results: true, candidate: true },
        },
        applications: { include: { candidate: true } },
      },
    });

    if (!request) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Recruitment request ${requestId} not found`,
      });
    }

    if (request.status !== RecruitmentRequestStatus.INTERVIEW_COMPLETED) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message:
          `Hiring decision requires status ${RecruitmentRequestStatus.INTERVIEW_COMPLETED}. ` +
          `Current status: ${request.status}`,
      });
    }

    if (request.interviews.length === 0) {
      throw new RpcException({
        status: HttpStatus.PRECONDITION_FAILED,
        message: 'No completed interviews are available for review',
      });
    }

    const incompleteInterviews = request.interviews.filter(
      (interview) =>
        interview.status !== InterviewStatus.COMPLETED ||
        interview.results.length === 0,
    );
    if (incompleteInterviews.length > 0) {
      throw new RpcException({
        status: HttpStatus.PRECONDITION_FAILED,
        message: 'All interviews must have recorded results before a final decision',
        interviewIds: incompleteInterviews.map((interview) => interview.id),
      });
    }

    const candidateResults = new Map<string, string[]>();
    for (const interview of request.interviews) {
      const results = candidateResults.get(interview.candidateId) ?? [];
      results.push(...interview.results.map((result) => result.result));
      candidateResults.set(interview.candidateId, results);
    }

    const selectedCandidateIds =
      decision === HiringDecision.HIRE
        ? [...candidateResults.entries()]
            .filter(([, results]) => results.includes(InterviewResult.PASS))
            .map(([candidateId]) => candidateId)
        : [];

    if (decision === HiringDecision.HIRE && selectedCandidateIds.length === 0) {
      throw new RpcException({
        status: HttpStatus.PRECONDITION_FAILED,
        message: 'HIRE requires at least one candidate with a PASS interview result',
      });
    }

    const targetStatus =
      decision === HiringDecision.HIRE
        ? RecruitmentRequestStatus.OFFER_EXTENDED
        : RecruitmentRequestStatus.REJECTED;
    const note = notes.trim();
    const transactions: any[] = [
      this.prisma.recruitmentRequest.update({
        where: { id: requestId },
        data: {
          status: targetStatus,
          rejectionReason: decision === HiringDecision.REJECT ? note : null,
        },
      }),
      this.prisma.requestLog.create({
        data: {
          requestId,
          action: 'FINAL_HIRING_DECISION',
          fromStatus: RecruitmentRequestStatus.INTERVIEW_COMPLETED,
          toStatus: targetStatus,
          performedById: adminId,
          metadata: {
            decision,
            notes: note,
            decidedAt: new Date().toISOString(),
            selectedCandidateIds,
          },
        },
      }),
    ];

    for (const application of request.applications) {
      const hired =
        decision === HiringDecision.HIRE &&
        selectedCandidateIds.includes(application.candidateId);
      const applicationStatus = hired
        ? RecruitmentRequestStatus.OFFER_EXTENDED
        : RecruitmentRequestStatus.REJECTED;
      const subject = hired
        ? `Hiring decision for ${request.position}`
        : `Application update for ${request.position}`;
      const body = hired
        ? `You have been selected for ${request.position}. The formal offer workflow has started.`
        : `Your application for ${request.position} was not selected.`;

      transactions.push(
        this.prisma.application.update({
          where: { id: application.id },
          data: { status: applicationStatus },
        }),
        this.prisma.emailLog.create({
          data: {
            userId: application.candidate.userId,
            toEmail: application.candidate.email,
            subject,
            body,
            status: EmailStatus.PENDING,
          },
        }),
      );
    }

    const [updatedRequest] = await this.prisma.$transaction(transactions);

    // Trigger candidate notifications and request status change notifications
    for (const application of request.applications) {
      const hired =
        decision === HiringDecision.HIRE &&
        selectedCandidateIds.includes(application.candidateId);
      const communicationType = hired
        ? NotificationType.OFFER
        : NotificationType.REJECTION;
      const subject = hired
        ? `Hiring decision for ${request.position}`
        : `Application update for ${request.position}`;
      const body = hired
        ? `You have been selected for ${request.position}. The formal offer workflow has started.`
        : `Your application for ${request.position} was not selected.`;

      this.notificationClient.send('notification.create_notification', {
        userId: application.candidate.userId,
        type: communicationType,
        title: subject,
        body,
        relatedEntityId: requestId,
        relatedEntityType: 'RecruitmentRequest',
      }).subscribe({
        error: (err) => console.error('Failed to send candidate decision notification:', err),
      });
    }

    this.notificationClient.send('notification.create_notification', {
      userId: request.createdById,
      type: NotificationType.REQUEST_UPDATE,
      title: `Request status update: ${targetStatus === RecruitmentRequestStatus.OFFER_EXTENDED ? 'Offer Extended' : 'Rejected'}`,
      body: `Recruitment request for ${request.position} has transitioned to ${targetStatus === RecruitmentRequestStatus.OFFER_EXTENDED ? 'Offer Extended' : 'Rejected'}.`,
      relatedEntityId: requestId,
      relatedEntityType: 'RecruitmentRequest',
    }).subscribe({
      error: (err) => console.error('Failed to send dept head decision notification:', err),
    });

    this.notificationClient.send('notification.send_to_role', {
      role: 'HR_MANAGER',
      type: NotificationType.REQUEST_UPDATE,
      title: `Request status update: ${targetStatus === RecruitmentRequestStatus.OFFER_EXTENDED ? 'Offer Extended' : 'Rejected'}`,
      body: `Recruitment request for ${request.position} has transitioned to ${targetStatus === RecruitmentRequestStatus.OFFER_EXTENDED ? 'Offer Extended' : 'Rejected'}.`,
      relatedEntityId: requestId,
      relatedEntityType: 'RecruitmentRequest',
    }).subscribe({
      error: (err) => console.error('Failed to send HR decision notification:', err),
    });

    return {
      request: updatedRequest,
      decision,
      selectedCandidateIds,
      communicationQueued: request.applications.length,
    };
  }
}
