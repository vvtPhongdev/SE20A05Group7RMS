import { InjectQueue } from '@nestjs/bullmq';
import { HttpStatus, Injectable, Inject } from '@nestjs/common';
import { RpcException, ClientProxy } from '@nestjs/microservices';
import {
  EmailStatus,
  OfferResponse,
  OfferStatus,
  RecruitmentRequestStatus,
  NotificationType,
} from '@wr/contracts';
import { JOB_NAMES, QUEUE_NAMES } from '@wr/queue';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/database/prisma.service';

interface OfferDetails {
  candidateId: string;
  compensation: string;
  startDate: string;
}

@Injectable()
export class OfferLetterService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.EMAIL_SEND) private readonly emailQueue: Queue,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  async generate(
    requestId: string,
    offerDetails: OfferDetails,
    generatedById: string,
  ) {
    const compensation = offerDetails.compensation?.trim();
    const startDate = new Date(offerDetails.startDate);

    if (!offerDetails.candidateId || !compensation || !generatedById) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'candidateId, compensation and HR Manager identity are required',
      });
    }

    if (Number.isNaN(startDate.getTime())) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'startDate must be a valid ISO-8601 date',
      });
    }

    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: requestId },
      include: {
        department: true,
        applications: {
          where: { candidateId: offerDetails.candidateId },
          include: { candidate: true },
        },
      },
    });

    if (!request) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Recruitment request ${requestId} not found`,
      });
    }

    if (request.status !== RecruitmentRequestStatus.OFFER_EXTENDED) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message:
          `Offer generation requires status ${RecruitmentRequestStatus.OFFER_EXTENDED}. ` +
          `Current status: ${request.status}`,
      });
    }

    const application = request.applications[0];
    if (
      !application ||
      application.status !== RecruitmentRequestStatus.OFFER_EXTENDED
    ) {
      throw new RpcException({
        status: HttpStatus.PRECONDITION_FAILED,
        message: 'The candidate was not selected by the final hiring decision',
      });
    }

    const existing = await this.prisma.offerLetter.findUnique({
      where: {
        requestId_candidateId: {
          requestId,
          candidateId: offerDetails.candidateId,
        },
      },
    });
    if (existing) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'An offer letter already exists for this candidate and request',
      });
    }

    const content = this.renderTemplate({
      candidateName: application.candidate.fullName,
      positionTitle: request.position,
      departmentName: request.department.name,
      compensation,
      startDate,
    });

    return this.prisma.offerLetter.create({
      data: {
        requestId,
        candidateId: offerDetails.candidateId,
        generatedById,
        positionTitle: request.position,
        departmentName: request.department.name,
        compensation,
        startDate,
        content,
        status: OfferStatus.DRAFT,
      },
      include: {
        request: true,
        candidate: true,
      },
    });
  }

  async get(id: string) {
    const offer = await this.prisma.offerLetter.findUnique({
      where: { id },
      include: { request: true, candidate: true },
    });
    if (!offer) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Offer letter ${id} not found`,
      });
    }
    return offer;
  }

  async send(id: string, sentById: string) {
    const offer = await this.prisma.offerLetter.findUnique({
      where: { id },
      include: { request: true, candidate: true },
    });

    if (!offer) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Offer letter ${id} not found`,
      });
    }

    if (offer.status !== OfferStatus.DRAFT) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: `Only DRAFT offers can be sent. Current status: ${offer.status}`,
      });
    }

    const subject = `Offer Letter - ${offer.positionTitle}`;
    const [emailLog, updatedOffer] = await this.prisma.$transaction([
      this.prisma.emailLog.create({
        data: {
          userId: offer.candidate.userId,
          toEmail: offer.candidate.email,
          subject,
          body: offer.content,
          status: EmailStatus.PENDING,
        },
      }),
      this.prisma.offerLetter.update({
        where: { id },
        data: {
          status: OfferStatus.SENT,
          sentAt: new Date(),
        },
      }),
      this.prisma.recruitmentRequest.update({
        where: { id: offer.requestId },
        data: { status: RecruitmentRequestStatus.OFFER_EXTENDED },
      }),
      this.prisma.application.update({
        where: {
          requestId_candidateId: {
            requestId: offer.requestId,
            candidateId: offer.candidateId,
          },
        },
        data: { status: RecruitmentRequestStatus.OFFER_EXTENDED },
      }),
      this.prisma.requestLog.create({
        data: {
          requestId: offer.requestId,
          action: 'OFFER_LETTER_SENT',
          toStatus: RecruitmentRequestStatus.OFFER_EXTENDED,
          performedById: sentById,
          metadata: {
            offerId: id,
            candidateId: offer.candidateId,
          },
        },
      }),
    ]);

    await this.prisma.offerLetter.update({
      where: { id },
      data: { emailLogId: emailLog.id },
    });

    await this.emailQueue.add(
      JOB_NAMES.SEND_EMAIL,
      {
        emailLogId: emailLog.id,
        to: offer.candidate.email,
        subject,
        body: offer.content,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );

    // Send in-app notification to candidate
    this.notificationClient.send('notification.create_notification', {
      userId: offer.candidate.userId,
      type: NotificationType.OFFER,
      title: 'Offer Letter Received',
      body: `An offer letter for the position of ${offer.positionTitle} has been sent to you. Please review and respond.`,
      relatedEntityId: offer.id,
      relatedEntityType: 'OfferLetter',
    }).subscribe({
      error: (err) => console.error('Failed to send candidate offer letter notification:', err),
    });

    // Send in-app status update notification to Department Head
    this.notificationClient.send('notification.create_notification', {
      userId: offer.request.createdById,
      type: NotificationType.REQUEST_UPDATE,
      title: `Offer letter sent for ${offer.positionTitle}`,
      body: `An offer letter has been sent to the candidate for ${offer.positionTitle}.`,
      relatedEntityId: offer.requestId,
      relatedEntityType: 'RecruitmentRequest',
    }).subscribe({
      error: (err) => console.error('Failed to send dept head offer letter notification:', err),
    });

    return { ...updatedOffer, emailLogId: emailLog.id };
  }

  async respond(
    id: string,
    response: OfferResponse,
    candidateUserId: string,
  ) {
    if (!Object.values(OfferResponse).includes(response)) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'response must be ACCEPT or DECLINE',
      });
    }

    const offer = await this.prisma.offerLetter.findUnique({
      where: { id },
      include: { candidate: true, request: true },
    });
    if (!offer) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Offer letter ${id} not found`,
      });
    }

    if (offer.candidate.userId !== candidateUserId) {
      throw new RpcException({
        status: HttpStatus.FORBIDDEN,
        message: 'This offer does not belong to the current candidate',
      });
    }

    if (offer.status !== OfferStatus.SENT) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: `Only SENT offers can be answered. Current status: ${offer.status}`,
      });
    }

    const accepted = response === OfferResponse.ACCEPT;
    const offerStatus = accepted ? OfferStatus.ACCEPTED : OfferStatus.DECLINED;
    const requestStatus = accepted
      ? RecruitmentRequestStatus.OFFER_ACCEPTED
      : RecruitmentRequestStatus.OFFER_DECLINED;

    const [updatedOffer] = await this.prisma.$transaction([
      this.prisma.offerLetter.update({
        where: { id },
        data: {
          status: offerStatus,
          respondedAt: new Date(),
        },
      }),
      this.prisma.application.update({
        where: {
          requestId_candidateId: {
            requestId: offer.requestId,
            candidateId: offer.candidateId,
          },
        },
        data: { status: requestStatus },
      }),
      this.prisma.recruitmentRequest.update({
        where: { id: offer.requestId },
        data: { status: requestStatus },
      }),
    ]);

    // Send in-app status change notification to Department Head
    this.notificationClient.send('notification.create_notification', {
      userId: offer.request.createdById,
      type: NotificationType.REQUEST_UPDATE,
      title: `Offer ${accepted ? 'Accepted' : 'Declined'}`,
      body: `The offer for ${offer.positionTitle} was ${accepted ? 'accepted' : 'declined'} by the candidate.`,
      relatedEntityId: offer.requestId,
      relatedEntityType: 'RecruitmentRequest',
    }).subscribe({
      error: (err) => console.error('Failed to send dept head offer response notification:', err),
    });

    // Send in-app status change notification to HR Manager role
    this.notificationClient.send('notification.send_to_role', {
      role: 'HR_MANAGER',
      type: NotificationType.REQUEST_UPDATE,
      title: `Offer ${accepted ? 'Accepted' : 'Declined'}`,
      body: `The offer for ${offer.positionTitle} was ${accepted ? 'accepted' : 'declined'} by the candidate.`,
      relatedEntityId: offer.requestId,
      relatedEntityType: 'RecruitmentRequest',
    }).subscribe({
      error: (err) => console.error('Failed to send HR offer response notification:', err),
    });

    // Send in-app status change notification to ADMIN role
    this.notificationClient.send('notification.send_to_role', {
      role: 'ADMIN',
      type: NotificationType.REQUEST_UPDATE,
      title: `Offer ${accepted ? 'Accepted' : 'Declined'}`,
      body: `The offer for ${offer.positionTitle} was ${accepted ? 'accepted' : 'declined'} by the candidate.`,
      relatedEntityId: offer.requestId,
      relatedEntityType: 'RecruitmentRequest',
    }).subscribe({
      error: (err) => console.error('Failed to send Admin offer response notification:', err),
    });

    return updatedOffer;
  }

  private renderTemplate(input: {
    candidateName: string;
    positionTitle: string;
    departmentName: string;
    compensation: string;
    startDate: Date;
  }) {
    return [
      `Dear ${input.candidateName},`,
      '',
      `We are pleased to offer you the position of ${input.positionTitle}.`,
      '',
      `Department: ${input.departmentName}`,
      `Compensation: ${input.compensation}`,
      `Start date: ${input.startDate.toISOString().slice(0, 10)}`,
      '',
      'Please review this offer and submit your acceptance or decline.',
      '',
      'Sincerely,',
      'HR Team',
    ].join('\n');
  }
}
