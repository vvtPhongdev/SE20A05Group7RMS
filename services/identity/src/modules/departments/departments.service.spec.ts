import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import { HttpStatus } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { PrismaService } from '../../common/database/prisma.service';
import { UserRole } from '@wr/contracts';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    department: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockOrgId = '00000000-0000-0000-0000-000000000000';
  const mockDeptId = '11111111-1111-1111-1111-111111111111';
  const mockParentDeptId = '22222222-2222-2222-2222-222222222222';
  const mockHeadUserId = '33333333-3333-3333-3333-333333333333';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DepartmentsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      organizationId: mockOrgId,
      name: 'Engineering',
      code: 'ENG',
      headUserId: mockHeadUserId,
      parentId: mockParentDeptId,
    };

    it('should successfully create a department', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue(null); // name is unique
      mockPrismaService.department.findUnique.mockResolvedValue(null); // code is unique
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: mockHeadUserId,
        role: UserRole.DEPARTMENT_HEAD,
      });

      // parent check finds parent in the same org
      mockPrismaService.department.findUnique.mockImplementation((params) => {
        if (params.where.id === mockParentDeptId) {
          return Promise.resolve({ id: mockParentDeptId, organizationId: mockOrgId });
        }
        return Promise.resolve(null);
      });

      const createdDept = { id: mockDeptId, ...createDto };
      mockPrismaService.department.create.mockResolvedValue(createdDept);

      const result = await service.create(createDto);

      expect(prisma.department.findFirst).toHaveBeenCalled();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: mockHeadUserId } });
      expect(prisma.department.create).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockHeadUserId },
        data: { departmentId: mockDeptId },
      });
      expect(result).toEqual(createdDept);
    });

    it('should throw CONFLICT if department name already exists in org', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.create(createDto)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.CONFLICT,
          message: `Department with name 'Engineering' already exists in this organization`,
        }),
      );
    });

    it('should throw CONFLICT if department code already exists in org', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue(null);
      mockPrismaService.department.findUnique.mockResolvedValue({ id: 'existing' }); // code exists

      await expect(service.create(createDto)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.CONFLICT,
          message: `Department with code 'ENG' already exists in this organization`,
        }),
      );
    });

    it('should throw BAD_REQUEST if department head user does not exist', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue(null);
      mockPrismaService.department.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(null); // user does not exist

      await expect(service.create(createDto)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Assigned department head user does not exist',
        }),
      );
    });

    it('should throw BAD_REQUEST if department head user does not have DEPARTMENT_HEAD role', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue(null);
      mockPrismaService.department.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: mockHeadUserId,
        role: UserRole.CANDIDATE,
      });

      await expect(service.create(createDto)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Assigned department head user must have the DEPARTMENT_HEAD role',
        }),
      );
    });

    it('should throw BAD_REQUEST if parent department does not belong to the same organization', async () => {
      mockPrismaService.department.findFirst.mockResolvedValue(null);
      mockPrismaService.department.findUnique.mockImplementation((params) => {
        if (params.where.id === mockParentDeptId) {
          // Parent is in a different org
          return Promise.resolve({ id: mockParentDeptId, organizationId: 'different-org-uuid' });
        }
        return Promise.resolve(null);
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: mockHeadUserId,
        role: UserRole.DEPARTMENT_HEAD,
      });

      await expect(service.create(createDto)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Parent department must belong to the same organization',
        }),
      );
    });
  });

  describe('list', () => {
    it('should successfully return departments optionally filtered by organizationId', async () => {
      const depts = [{ id: '1', name: 'HR', organizationId: mockOrgId }];
      mockPrismaService.department.findMany.mockResolvedValue(depts);

      const result = await service.list({ organizationId: mockOrgId });

      expect(prisma.department.findMany).toHaveBeenCalledWith({
        where: { organizationId: mockOrgId },
        orderBy: { name: 'asc' },
        include: expect.any(Object),
      });
      expect(result).toEqual(depts);
    });
  });

  describe('get', () => {
    it('should successfully get department by ID', async () => {
      const dept = { id: mockDeptId, name: 'HR' };
      mockPrismaService.department.findUnique.mockResolvedValue(dept);

      const result = await service.get({ id: mockDeptId });

      expect(result).toEqual(dept);
    });

    it('should throw NOT_FOUND if department not found', async () => {
      mockPrismaService.department.findUnique.mockResolvedValue(null);

      await expect(service.get({ id: 'nonexistent' })).rejects.toThrow(
        new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Department with ID nonexistent not found',
        }),
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      id: mockDeptId,
      name: 'Engineering New',
      code: 'ENGN',
      parentId: mockParentDeptId,
    };

    it('should successfully update department', async () => {
      mockPrismaService.department.findUnique.mockImplementation((params) => {
        if (params.where.id === mockDeptId) {
          return Promise.resolve({ id: mockDeptId, organizationId: mockOrgId });
        }
        if (params.where.id === mockParentDeptId) {
          return Promise.resolve({ id: mockParentDeptId, organizationId: mockOrgId });
        }
        return Promise.resolve(null);
      });
      mockPrismaService.department.findFirst.mockResolvedValue(null); // name unique check passes
      mockPrismaService.department.update.mockResolvedValue(updateDto);

      const result = await service.update(updateDto);

      expect(prisma.department.update).toHaveBeenCalled();
      expect(result.name).toBe('Engineering New');
    });

    it('should throw BAD_REQUEST if department is assigned to itself as parent', async () => {
      mockPrismaService.department.findUnique.mockResolvedValue({
        id: mockDeptId,
        organizationId: mockOrgId,
      });

      await expect(
        service.update({
          id: mockDeptId,
          parentId: mockDeptId, // self reference
        }),
      ).rejects.toThrow(
        new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'A department cannot be its own parent',
        }),
      );
    });

    it('assigns the selected department head to the department', async () => {
      mockPrismaService.department.findUnique.mockImplementation((params) => {
        if (params.where.id === mockDeptId) {
          return Promise.resolve({ id: mockDeptId, organizationId: mockOrgId });
        }
        return Promise.resolve(null);
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: mockHeadUserId,
        role: UserRole.DEPARTMENT_HEAD,
      });
      mockPrismaService.department.update.mockResolvedValue({ id: mockDeptId });

      await service.update({ id: mockDeptId, headUserId: mockHeadUserId });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockHeadUserId },
        data: { departmentId: mockDeptId },
      });
    });
  });

  describe('delete', () => {
    it('should successfully delete department', async () => {
      mockPrismaService.department.findUnique.mockResolvedValue({ id: mockDeptId });
      mockPrismaService.department.delete.mockResolvedValue({ id: mockDeptId });

      const result = await service.delete({ id: mockDeptId });

      expect(prisma.department.delete).toHaveBeenCalledWith({ where: { id: mockDeptId } });
      expect(result).toEqual({ success: true });
    });
  });
});
