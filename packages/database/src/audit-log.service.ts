import { AuditLog, Prisma } from '@prisma/client';

export interface AuditLogEntry {
  entityType: string;
  entityId: string;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  performedById?: string | null;
  reason?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/**
 * T-107: Generic audit trail writer/reader, shared by every service.
 * Each microservice provides its own `PrismaClient`-derived instance
 * (e.g. NestJS `PrismaService`), so this class only depends on the
 * `auditLog` delegate being available.
 */
export class AuditLogService {
  constructor(
    private readonly prisma: {
      // Accelerate augments each delegate's argument types with cacheStrategy.
      // Keep this boundary structural so both direct and Accelerate clients work.
      auditLog: any;
    },
  ) {}

  async log(entry: AuditLogEntry): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        fromStatus: entry.fromStatus ?? undefined,
        toStatus: entry.toStatus ?? undefined,
        performedById: entry.performedById ?? undefined,
        reason: entry.reason ?? undefined,
        metadata: entry.metadata,
      },
    });
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
