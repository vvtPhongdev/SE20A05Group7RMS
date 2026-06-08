import { Injectable, HttpStatus, Inject } from '@nestjs/common';
import { RpcException, ClientProxy } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import {
  InterviewStatus,
  InterviewResult,
  RecruitmentRequestStatus,
  NotificationType,
  UserRole,
} from '@wr/contracts';

@Injectable()
export class InterviewResultService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  /**
   * T-053: Record interview PASS/FAIL result with detailed notes and evaluator.
   * Updates candidate pipeline status (Application status) and triggers workflows (FR-15).
   */
  async recordResult(payload: {
    interviewId: string;
    result: string;
    notes: string;
    evaluatorId?: string;
  }) {
    const { interviewId, result, notes, evaluatorId } = payload;

    const schedule = await this.prisma.interviewSchedule.findUnique({
      where: { id: interviewId },
      include: {
        candidate: true,
        request: true,
      },
    });

    if (!schedule) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Interview schedule ${interviewId} not found`,
      });
    }

    if (schedule.status === InterviewStatus.CANCELLED) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Cannot record a result for a cancelled interview',
      });
    }

    if (schedule.status === InterviewStatus.COMPLETED) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Interview result has already been recorded for this schedule',
      });
    }

    if (!Object.values(InterviewResult).includes(result as InterviewResult)) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Result must be one of: ${Object.values(InterviewResult).join(', ')}`,
      });
    }

    if (!notes?.trim()) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'notes are mandatory when recording an interview result',
      });
    }

    // Verify evaluator exists if provided
    if (evaluatorId) {
      const evaluator = await this.prisma.user.findUnique({
        where: { id: evaluatorId },
      });
      if (!evaluator) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Evaluator user ${evaluatorId} not found`,
        });
      }
    }

    // Find the candidate application
    const application = await this.prisma.application.findUnique({
      where: {
        requestId_candidateId: {
          requestId: schedule.requestId,
          candidateId: schedule.candidateId,
        },
      },
    });

    if (!application) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Application for candidate ${schedule.candidateId} in request ${schedule.requestId} not found`,
      });
    }

    // Check for other active schedules for the request
    const activeSchedulesCount = await this.prisma.interviewSchedule.count({
      where: {
        requestId: schedule.requestId,
        status: { in: [InterviewStatus.SCHEDULED, InterviewStatus.RESCHEDULED] },
        id: { not: interviewId },
      },
    });

    const isLastInterview = activeSchedulesCount === 0;

    // Define pipeline status updates
    const isPass = result === InterviewResult.PASS;
    const nextAppStatus = isPass ? RecruitmentRequestStatus.INTERVIEW_COMPLETED : RecruitmentRequestStatus.REJECTED;

    const transactions: any[] = [
      // 1. Create InterviewResult record
      this.prisma.interviewResult.create({
        data: {
          interviewId,
          result,
          notes: notes.trim(),
          evaluatorId: evaluatorId || null,
        },
      }),

      // 2. Mark Schedule as COMPLETED
      this.prisma.interviewSchedule.update({
        where: { id: interviewId },
        data: { status: InterviewStatus.COMPLETED },
      }),

      // 3. Update Application Status
      this.prisma.application.update({
        where: { id: application.id },
        data: { status: nextAppStatus },
      }),

      // 4. Create RequestLog for candidate evaluation outcome
      this.prisma.requestLog.create({
        data: {
          requestId: schedule.requestId,
          action: isPass ? 'CANDIDATE_PASSED_INTERVIEW' : 'CANDIDATE_FAILED_INTERVIEW',
          performedById: evaluatorId || 'SYSTEM',
          metadata: {
            interviewId,
            candidateId: schedule.candidateId,
            notes: notes.trim(),
          },
        },
      }),
    ];

    // 5. If all schedules are finished, transition RecruitmentRequest to INTERVIEW_COMPLETED
    if (isLastInterview) {
      transactions.push(
        this.prisma.recruitmentRequest.update({
          where: { id: schedule.requestId },
          data: { status: RecruitmentRequestStatus.INTERVIEW_COMPLETED },
        }),
        this.prisma.requestLog.create({
          data: {
            requestId: schedule.requestId,
            action: 'INTERVIEW_STAGE_COMPLETED',
            fromStatus: schedule.request.status,
            toStatus: RecruitmentRequestStatus.INTERVIEW_COMPLETED,
            performedById: evaluatorId || 'SYSTEM',
            metadata: {
              completedAt: new Date().toISOString(),
            },
          },
        }),
      );
    }

    const [recordedResult] = await this.prisma.$transaction(transactions);

    // --- Next-step communications & workflows ---
    
    // 1. If candidate failed, trigger rejection email and notification
    if (!isPass) {
      const emailSubject = `Application Update: ${schedule.request.position}`;
      const emailBody = [
        `Dear ${schedule.candidate.fullName},`,
        '',
        `Thank you for taking the time to interview with us for the position of ${schedule.request.position}.`,
        '',
        `We appreciate your interest in our company, but we regret to inform you that we have decided to move forward with other candidates at this stage.`,
        '',
        'We wish you all the best in your job search and future endeavors.',
        '',
        'Best regards,',
        'HR Team — Recruitment Management System',
      ].join('\n');

      const notifTitle = 'Application Update';
      const notifBody = `Your application for ${schedule.request.position} was not selected.`;

      // Enqueue email
      this.notificationClient.send('notification.send_email', {
        userId: schedule.candidate.userId,
        toEmail: schedule.candidate.email,
        subject: emailSubject,
        body: emailBody,
      }).subscribe({
        error: (err) => console.error('Failed to send rejection email:', err),
      });

      // Send in-app notification
      this.notificationClient.send('notification.create_notification', {
        userId: schedule.candidate.userId,
        type: NotificationType.REJECTION,
        title: notifTitle,
        body: notifBody,
        relatedEntityId: schedule.requestId,
        relatedEntityType: 'RecruitmentRequest',
      }).subscribe({
        error: (err) => console.error('Failed to send rejection notification:', err),
      });
    }

    // 2. If all interviews are completed, notify Admins to review and make final decision (FR-15)
    if (isLastInterview) {
      this.notificationClient.send('notification.send_to_role', {
        role: UserRole.ADMIN,
        title: 'Review Required: Interview Stage Completed',
        body: `All scheduled interviews for "${schedule.request.position}" are completed. Please review results and make the final decision.`,
        type: NotificationType.PLAN_UPDATE,
        relatedEntityId: schedule.requestId,
        relatedEntityType: 'RecruitmentRequest',
      }).subscribe({
        error: (err) => console.error('Failed to send Admin review notifications:', err),
      });

      this.notificationClient.send('notification.create_notification', {
        userId: schedule.request.createdById,
        type: NotificationType.REQUEST_UPDATE,
        title: 'Request status update: Interview Completed',
        body: `All interviews for recruitment request "${schedule.request.position}" have been completed.`,
        relatedEntityId: schedule.requestId,
        relatedEntityType: 'RecruitmentRequest',
      }).subscribe({
        error: (err) => console.error('Failed to send Dept Head review notifications:', err),
      });
    }

    return recordedResult;
  }
}
