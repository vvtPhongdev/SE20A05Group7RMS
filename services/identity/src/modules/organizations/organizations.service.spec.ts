import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import { HttpStatus } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../../common/database/prisma.service';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    organization: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      name: 'Acme Corporation',
      slug: 'acme-corp',
    };

    it('should successfully create an organization', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);
      mockPrismaService.organization.create.mockResolvedValue({ id: 'org-uuid-1', ...createDto });

      const result = await service.create(createDto);

      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { slug: createDto.slug },
      });
      expect(prisma.organization.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(result).toEqual({ id: 'org-uuid-1', ...createDto });
    });

    it('should throw CONFLICT RpcException if organization slug already exists', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(createDto)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.CONFLICT,
          message: `Organization with slug 'acme-corp' already exists`,
        }),
      );

      expect(prisma.organization.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should successfully return all organizations ordered by name', async () => {
      const orgs = [
        { id: '1', name: 'Acme Corp', slug: 'acme-corp' },
        { id: '2', name: 'Beta Corp', slug: 'beta-corp' },
      ];
      mockPrismaService.organization.findMany.mockResolvedValue(orgs);

      const result = await service.list();

      expect(prisma.organization.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(orgs);
    });
  });

  describe('get', () => {
    it('should return an organization if found by ID', async () => {
      const org = { id: 'org-uuid-1', name: 'Acme Corp', slug: 'acme-corp' };
      mockPrismaService.organization.findUnique.mockResolvedValue(org);

      const result = await service.get({ id: 'org-uuid-1' });

      expect(prisma.organization.findUnique).toHaveBeenCalledWith({
        where: { id: 'org-uuid-1' },
      });
      expect(result).toEqual(org);
    });

    it('should throw NOT_FOUND RpcException if organization is not found', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.get({ id: 'nonexistent-uuid' })).rejects.toThrow(
        new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'Organization with ID nonexistent-uuid not found',
        }),
      );
    });
  });
});
