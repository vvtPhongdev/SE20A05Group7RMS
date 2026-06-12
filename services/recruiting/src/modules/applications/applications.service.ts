import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';

@Injectable()
export class ApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: { requestId: string; candidateId?: string; userId?: string }) {
    const { requestId, candidateId, userId } = payload;

    if (!requestId) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'requestId is required',
      });
    }

    const request = await this.prisma.recruitmentRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Recruitment request with ID ${requestId} not found`,
      });
    }

    let candidateProfile = null;

    if (candidateId) {
      candidateProfile = await this.prisma.candidateProfile.findUnique({
        where: { id: candidateId },
      });
    } else if (userId) {
      candidateProfile = await this.prisma.candidateProfile.findUnique({
        where: { userId },
      });

      if (!candidateProfile) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });

        if (user && user.role === 'CANDIDATE') {
          candidateProfile = await this.prisma.candidateProfile.create({
            data: {
              userId: user.id,
              fullName: user.displayName,
              email: user.email,
              phone: user.phone || null,
              summary: '',
              structuredData: {},
            },
          });
        }
      }
    }

    if (!candidateProfile) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: 'Candidate profile not found or user is not a candidate',
      });
    }

    const existing = await this.prisma.application.findUnique({
      where: {
        requestId_candidateId: {
          requestId,
          candidateId: candidateProfile.id,
        },
      },
    });

    if (existing) {
      throw new RpcException({
        status: HttpStatus.CONFLICT,
        message: 'Candidate has already applied to this recruitment request',
      });
    }

    return this.prisma.application.create({
      data: {
        requestId,
        candidateId: candidateProfile.id,
        status: 'SUBMITTED',
      },
      include: {
        request: true,
        candidate: true,
      },
    });
  }

  async list(query: { candidateId?: string; requestId?: string; status?: string }) {
    const { candidateId, requestId, status } = query;
    const where: any = {};

    if (candidateId) {
      where.candidateId = candidateId;
    }
    if (requestId) {
      where.requestId = requestId;
    }
    if (status) {
      where.status = status;
    }

    return this.prisma.application.findMany({
      where,
      include: {
        request: true,
        candidate: {
          include: {
            cvDocuments: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { screeningStatus: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async get(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        request: true,
        candidate: true,
      },
    });

    if (!application) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Application with ID ${id} not found`,
      });
    }

    return application;
  }

  async updateStatus(id: string, status: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
    });

    if (!application) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Application with ID ${id} not found`,
      });
    }

    return this.prisma.application.update({
      where: { id },
      data: { status },
      include: {
        request: true,
        candidate: true,
      },
    });
  }
}
