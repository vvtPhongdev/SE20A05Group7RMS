import { Injectable, HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../common/database/prisma.service';
import { UserRole } from '@wr/contracts';

@Injectable()
export class CandidateProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(id: string) {
    let profile = await this.prisma.candidateProfile.findFirst({
      where: {
        OR: [{ id: id }, { userId: id }],
      },
      include: {
        cvDocuments: true,
        applications: {
          include: {
            request: true,
          },
        },
      },
    });

    if (!profile) {
      // Self-healing: if the user exists and is a CANDIDATE, create their profile record
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (user && user.role === UserRole.CANDIDATE) {
        profile = await this.prisma.candidateProfile.create({
          data: {
            userId: user.id,
            fullName: user.displayName,
            email: user.email,
            phone: user.phone || null,
            summary: '',
            structuredData: {},
          },
          include: {
            cvDocuments: true,
            applications: {
              include: {
                request: true,
              },
            },
          },
        });
      } else {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `Candidate profile not found for ID ${id}`,
        });
      }
    }

    return profile;
  }

  async updateProfile(id: string, data: any) {
    const profile = await this.prisma.candidateProfile.findFirst({
      where: {
        OR: [{ id: id }, { userId: id }],
      },
    });

    if (!profile) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Candidate profile not found for ID ${id}`,
      });
    }

    // Clean up updates data to avoid prisma schema errors
    const { id: _, userId: __, createdAt: ___, updatedAt: ____, ...allowedData } = data;

    return this.prisma.candidateProfile.update({
      where: { id: profile.id },
      data: allowedData,
    });
  }
}
