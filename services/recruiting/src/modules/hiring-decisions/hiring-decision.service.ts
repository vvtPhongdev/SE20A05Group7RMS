import { HttpStatus, Injectable, Inject } from '@nestjs/common';
import { RpcException, ClientProxy } from '@nestjs/microservices';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JOB_NAMES, QUEUE_NAMES } from '@wr/queue';
import { firstValueFrom } from 'rxjs';
import { randomUUID } from 'node:crypto';
import {
  EmailStatus,
  HiringDecision,
  InterviewResult,
  InterviewStatus,
  NotificationType,
  RecruitmentRequestStatus,
  UserRole,
} from '@wr/contracts';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class HiringDecisionService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
    @InjectQueue(QUEUE_NAMES.EMAIL_SEND) private readonly emailQueue: Queue,
  ) {}

  async decide(
    requestId: string,
    decision: HiringDecision,
    notes: string,
    adminId: string,
    offerDetails?: { candidateId: string; compensation: string; startDate: string },
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

    const offerStartDate = offerDetails?.startDate ? new Date(offerDetails.startDate) : null;
    if (
      decision === HiringDecision.HIRE &&
      (!offerDetails?.candidateId ||
        !offerDetails.compensation?.trim() ||
        !offerStartDate ||
        Number.isNaN(offerStartDate.getTime()))
    ) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'HIRE requires candidateId, compensation, and a valid offer startDate',
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
        department: { select: { name: true } },
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

    const selectedCandidateIds = decision === HiringDecision.HIRE ? [offerDetails!.candidateId] : [];
    const interviewsForDecision =
      decision === HiringDecision.HIRE
        ? request.interviews.filter((interview) => interview.candidateId === offerDetails!.candidateId)
        : request.interviews;

    if (interviewsForDecision.length === 0) {
      throw new RpcException({
        status: HttpStatus.PRECONDITION_FAILED,
        message:
          decision === HiringDecision.HIRE
            ? 'No completed interviews are available for the selected candidate'
            : 'No completed interviews are available for review',
      });
    }

    const incompleteInterviews = interviewsForDecision.filter(
      (interview) =>
        interview.status !== InterviewStatus.COMPLETED || interview.results.length === 0,
    );
    if (incompleteInterviews.length > 0) {
      throw new RpcException({
        status: HttpStatus.PRECONDITION_FAILED,
        message:
          decision === HiringDecision.HIRE
            ? 'The selected candidate interview must have recorded results before hire'
            : 'All interviews must have recorded results before a final decision',
        interviewIds: incompleteInterviews.map((interview) => interview.id),
      });
    }

    const candidateResults = new Map<string, string[]>();
    for (const interview of request.interviews) {
      const results = candidateResults.get(interview.candidateId) ?? [];
      results.push(...interview.results.map((result) => result.result));
      candidateResults.set(interview.candidateId, results);
    }

    const selectedResults = offerDetails ? candidateResults.get(offerDetails.candidateId) : undefined;
    const selectedApplication = offerDetails
      ? request.applications.find((application) => application.candidateId === offerDetails.candidateId)
      : undefined;
    if (decision === HiringDecision.HIRE && (selectedResults?.length ?? 0) < 2) {
      throw new RpcException({
        status: HttpStatus.PRECONDITION_FAILED,
        message: 'The selected candidate must have feedback from at least 2 interviewers before hire',
      });
    }

    if (
      decision === HiringDecision.HIRE &&
      (!selectedApplication || !selectedResults?.includes(InterviewResult.PASS))
    ) {
      throw new RpcException({
        status: HttpStatus.PRECONDITION_FAILED,
        message: 'The selected candidate must belong to the request and have a PASS interview result',
      });
    }

    const targetStatus =
      decision === HiringDecision.HIRE
        ? RecruitmentRequestStatus.OFFER_EXTENDED
        : RecruitmentRequestStatus.NOT_HIRED;
    const note = notes.trim();

    // Render templates for all applications in parallel before transaction
    const applicationCommunications = await Promise.all(
      request.applications.map(async (application) => {
        const hired =
          decision === HiringDecision.HIRE &&
          selectedCandidateIds.includes(application.candidateId);
        const applicationStatus = hired
          ? RecruitmentRequestStatus.OFFER_EXTENDED
          : RecruitmentRequestStatus.NOT_HIRED;

        const emailLogId = randomUUID();
        const offerId = hired ? randomUUID() : undefined;
        let subject = hired
          ? `Offer Letter: ${request.position}`
          : `Application update for ${request.position}`;
        const offerContent = hired
          ? [
              'OFFER FRAMEWORK',
              '',
              `Candidate: ${application.candidate.fullName}`,
              `Position: ${request.position}`,
              `Department: ${request.department.name}`,
              `Compensation: ${offerDetails!.compensation.trim()}`,
              `Proposed start date: ${offerStartDate!.toISOString().slice(0, 10)}`,
              '',
              `You are being offered to join the ${request.department.name} department.`,
              '',
              'Decision notes:',
              note,
            ].join('\n')
          : '';
        let body = hired
          ? [
              `Dear ${application.candidate.fullName},`,
              '',
              `We are pleased to offer you the position of ${request.position} in ${request.department.name}.`,
              '',
              offerContent,
              '',
              'Please review and accept or decline this offer in the candidate portal.',
            ].join('\n')
          : `Your application for ${request.position} was not selected.`;

        if (hired) {
          try {
            const rendered = await firstValueFrom(
              this.notificationClient.send('notification.render_template', {
                templateType: 'OFFER_LETTER',
                templateData: {
                  candidateName: application.candidate.fullName,
                  position: request.position,
                  offerContent,
                  nextSteps:
                    'Please review the offer details and accept or decline the offer in the candidate portal.',
                  responseDeadline: new Date(
                    Date.now() + 7 * 24 * 60 * 60 * 1000,
                  ).toLocaleDateString('en-GB'),
                },
              }),
            );
            subject = rendered.subject;
            body = rendered.body;
          } catch (err) {
            console.error('Failed to render offer letter email template:', err);
          }
        } else if (applicationStatus === RecruitmentRequestStatus.NOT_HIRED) {
          try {
            const rendered = await firstValueFrom(
              this.notificationClient.send('notification.render_template', {
                templateType: 'REJECTION',
                templateData: {
                  candidateName: application.candidate.fullName,
                  position: request.position,
                  rejectionReason: note,
                },
              }),
            );
            subject = rendered.subject;
            body = rendered.body;
          } catch (err) {
            console.error('Failed to render rejection email template:', err);
          }
        }

        return {
          application,
          applicationStatus,
          hired,
          emailLogId,
          offerId,
          subject,
          body,
        };
      }),
    );

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
          action:
            decision === HiringDecision.HIRE ? 'HIRING_DECISION_HIRE' : 'HIRING_DECISION_REJECT',
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

    for (const communication of applicationCommunications) {
      transactions.push(
        this.prisma.application.update({
          where: { id: communication.application.id },
          data: { status: communication.applicationStatus },
        }),
        this.prisma.emailLog.create({
          data: {
            id: communication.emailLogId,
            userId: communication.application.candidate.userId,
            toEmail: communication.application.candidate.email,
            subject: communication.subject,
            body: communication.body,
            status: EmailStatus.PENDING,
          },
        }),
        this.prisma.notification.create({
          data: {
            userId: communication.application.candidate.userId,
            type:
              communication.applicationStatus === RecruitmentRequestStatus.OFFER_EXTENDED
                ? NotificationType.OFFER
                : NotificationType.REJECTION,
            title: communication.subject,
            body: communication.body,
            relatedEntityId: communication.offerId ?? requestId,
            relatedEntityType: communication.offerId ? 'OfferLetter' : 'RecruitmentRequest',
          },
        }),
      );
      if (communication.hired) {
        transactions.push(
          this.prisma.offerLetter.create({
            data: {
              id: communication.offerId!,
              requestId,
              candidateId: communication.application.candidateId,
              generatedById: adminId,
              positionTitle: request.position,
              departmentName: request.department.name,
              compensation: offerDetails!.compensation.trim(),
              startDate: offerStartDate!,
              content: communication.body,
              status: 'SENT',
              emailLogId: communication.emailLogId,
              sentAt: new Date(),
            },
          }),
        );
      }
    }

    const results = await this.prisma.$transaction(transactions);
    const updatedRequest = results[0];

    for (const communication of applicationCommunications) {
      try {
        await this.emailQueue.add(
          JOB_NAMES.SEND_EMAIL,
          {
            emailLogId: communication.emailLogId,
            to: communication.application.candidate.email,
            subject: communication.subject,
            body: communication.body,
          },
          {
            jobId: `email-log-${communication.emailLogId}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
          },
        );
      } catch (error) {
        await this.prisma.emailLog.update({
          where: { id: communication.emailLogId },
          data: {
            status: EmailStatus.FAILED,
            errorMessage: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }

    this.notificationClient
      .send('notification.create_notification', {
        userId: request.createdById,
        type: NotificationType.REQUEST_UPDATE,
        title: `Request status update: ${targetStatus === RecruitmentRequestStatus.OFFER_EXTENDED ? 'Offer Extended' : 'Rejected'}`,
        body: `Recruitment request for ${request.position} has transitioned to ${targetStatus === RecruitmentRequestStatus.OFFER_EXTENDED ? 'Offer Extended' : 'Rejected'}.`,
        relatedEntityId: requestId,
        relatedEntityType: 'RecruitmentRequest',
      })
      .subscribe({
        error: (err) => console.error('Failed to send dept head decision notification:', err),
      });

    this.notificationClient
      .send('notification.send_to_role', {
        role: UserRole.HR_LEADER,
        type: NotificationType.REQUEST_UPDATE,
        title: `Request status update: ${targetStatus === RecruitmentRequestStatus.OFFER_EXTENDED ? 'Offer Extended' : 'Rejected'}`,
        body: `Recruitment request for ${request.position} has transitioned to ${targetStatus === RecruitmentRequestStatus.OFFER_EXTENDED ? 'Offer Extended' : 'Rejected'}.`,
        relatedEntityId: requestId,
        relatedEntityType: 'RecruitmentRequest',
      })
      .subscribe({
        error: (err) => console.error('Failed to send HR decision notification:', err),
      });

    return {
      request: updatedRequest,
      decision,
      selectedCandidateIds,
      offerIds: applicationCommunications.flatMap((communication) =>
        communication.offerId ? [communication.offerId] : [],
      ),
      communicationQueued: request.applications.length,
    };
  }

  async requestInfo(payload: {
    requestId: string;
    candidateId: string;
    notes: string;
    adminId: string;
  }) {
    if (!payload.notes?.trim()) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Information request notes are required',
      });
    }

    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: payload.requestId },
      include: {
        interviews: {
          where: { candidateId: payload.candidateId },
        },
      },
    });

    if (!request) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Recruitment request ${payload.requestId} not found`,
      });
    }
    if (request.status !== RecruitmentRequestStatus.INTERVIEW_COMPLETED) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Additional information can only be requested after interviews are completed',
      });
    }
    if (request.interviews.length === 0) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: 'No interview was found for this candidate and request',
      });
    }

    return this.prisma.requestLog.create({
      data: {
        requestId: payload.requestId,
        action: 'FINAL_DECISION_INFO_REQUESTED',
        performedById: payload.adminId,
        metadata: {
          candidateId: payload.candidateId,
          notes: payload.notes.trim(),
        },
      },
    });
  }
}
