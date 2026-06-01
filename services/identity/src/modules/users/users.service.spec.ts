import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import { HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../common/database/prisma.service';
import { UserRole } from '@wr/contracts';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
    department: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should successfully list users with pagination and return data and meta', async () => {
      mockPrismaService.user.count.mockResolvedValue(15);
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: '1', email: 'user1@example.com', role: UserRole.CANDIDATE },
        { id: '2', email: 'user2@example.com', role: UserRole.CANDIDATE },
      ]);

      const result = await service.list({ page: 2, limit: 2 });

      expect(prisma.user.count).toHaveBeenCalledWith({ where: {} });
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 2,
        take: 2,
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({
        total: 15,
        page: 2,
        limit: 2,
        totalPages: 8,
      });
    });

    it('should filter users by role when role parameter is provided', async () => {
      mockPrismaService.user.count.mockResolvedValue(3);
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: '1', email: 'admin@example.com', role: UserRole.ADMIN },
      ]);

      await service.list({ page: 1, limit: 10, role: UserRole.ADMIN });

      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { role: UserRole.ADMIN },
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { role: UserRole.ADMIN },
        }),
      );
    });
  });

  describe('get', () => {
    it('should return a user if found by ID', async () => {
      const user = { id: 'uuid-1', email: 'test@example.com', role: UserRole.HR_MANAGER };
      mockPrismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.get({ id: 'uuid-1' });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        select: expect.any(Object),
      });
      expect(result).toEqual(user);
    });

    it('should throw NOT_FOUND RpcException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.get({ id: 'uuid-nonexistent' })).rejects.toThrow(
        new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'User with ID uuid-nonexistent not found',
        }),
      );
    });
  });

  describe('create', () => {
    const mockOrgId = '00000000-0000-0000-0000-000000000000';
    const mockDeptId = '11111111-1111-1111-1111-111111111111';

    const createUserDto = {
      email: 'new@example.com',
      displayName: 'New User',
      role: UserRole.DEPARTMENT_HEAD,
      organizationId: mockOrgId,
      departmentId: mockDeptId,
      phone: '0912345678',
      password: 'Password123!',
    };

    it('should successfully create a new user with password hashing', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null); // uniqueness check passes
      mockPrismaService.organization.findUnique.mockResolvedValue({ id: mockOrgId });
      mockPrismaService.department.findUnique.mockResolvedValue({ id: mockDeptId });
      
      const createdUser = {
        id: '22222222-2222-2222-2222-222222222222',
        email: createUserDto.email,
        displayName: createUserDto.displayName,
        role: createUserDto.role,
        organizationId: createUserDto.organizationId,
        departmentId: createUserDto.departmentId,
        phone: createUserDto.phone,
        isActive: true,
      };
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: createUserDto.organizationId },
      });
      expect(prisma.department.findUnique).toHaveBeenCalledWith({
        where: { id: createUserDto.departmentId },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 12);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: createUserDto.email,
          displayName: createUserDto.displayName,
          role: createUserDto.role,
          organizationId: createUserDto.organizationId,
          departmentId: createUserDto.departmentId,
          phone: createUserDto.phone,
          passwordHash: 'hashed-password',
          isActive: true,
        },
        select: expect.any(Object),
      });
      expect(result).toEqual(createdUser);
    });

    it('should throw CONFLICT RpcException if email is already taken', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.create(createUserDto)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.CONFLICT,
          message: 'Email already exists',
        }),
      );

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw BAD_REQUEST RpcException if organization does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.create(createUserDto)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Organization does not exist',
        }),
      );

      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw BAD_REQUEST RpcException if department does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.organization.findUnique.mockResolvedValue({ id: mockOrgId });
      mockPrismaService.department.findUnique.mockResolvedValue(null);

      await expect(service.create(createUserDto)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Department does not exist',
        }),
      );

      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const mockUserId = '22222222-2222-2222-2222-222222222222';
    const mockNewDeptId = '33333333-3333-3333-3333-333333333333';

    const updateDto = {
      id: mockUserId,
      displayName: 'Updated Name',
      phone: '0987654321',
      isActive: false,
      departmentId: mockNewDeptId,
    };

    it('should successfully update user details', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: mockUserId });
      mockPrismaService.department.findUnique.mockResolvedValue({ id: mockNewDeptId });
      const updatedUser = {
        id: mockUserId,
        displayName: updateDto.displayName,
        phone: updateDto.phone,
        isActive: updateDto.isActive,
        departmentId: updateDto.departmentId,
      };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(updateDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: mockUserId } });
      expect(prisma.department.findUnique).toHaveBeenCalledWith({ where: { id: mockNewDeptId } });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: {
          displayName: updateDto.displayName,
          phone: updateDto.phone,
          isActive: updateDto.isActive,
          departmentId: updateDto.departmentId,
        },
        select: expect.any(Object),
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NOT_FOUND RpcException when updating non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.update(updateDto)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: `User with ID ${mockUserId} not found`,
        }),
      );
    });
  });

  describe('delete', () => {
    it('should successfully delete an existing user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-uuid' });
      mockPrismaService.user.delete.mockResolvedValue({ id: 'user-uuid' });

      const result = await service.delete({ id: 'user-uuid' });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-uuid' } });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-uuid' } });
      expect(result).toEqual({ success: true });
    });

    it('should throw NOT_FOUND RpcException if user to delete does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.delete({ id: 'user-uuid' })).rejects.toThrow(
        new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'User with ID user-uuid not found',
        }),
      );
    });
  });

  describe('updateRole', () => {
    it('should successfully update role if valid UserRole is provided', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-uuid', role: UserRole.CANDIDATE });
      mockPrismaService.user.update.mockResolvedValue({ id: 'user-uuid', role: UserRole.ADMIN });

      const result = await service.updateRole({ id: 'user-uuid', role: UserRole.ADMIN });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid' },
        data: { role: UserRole.ADMIN },
        select: expect.any(Object),
      });
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should throw BAD_REQUEST RpcException if role value is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-uuid' });

      await expect(service.updateRole({ id: 'user-uuid', role: 'INVALID_ROLE' })).rejects.toThrow(
        new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid role: INVALID_ROLE. Must be one of ADMIN, DEPARTMENT_HEAD, HR_MANAGER, CANDIDATE',
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('should successfully update active status', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-uuid', isActive: true });
      mockPrismaService.user.update.mockResolvedValue({ id: 'user-uuid', isActive: false });

      const result = await service.updateStatus({ id: 'user-uuid', isActive: false });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-uuid' },
        data: { isActive: false },
        select: expect.any(Object),
      });
      expect(result.isActive).toBe(false);
    });
  });
});
