import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationsService } from './registrations.service';
import { PrismaService } from '../prisma/prisma.service';

import { NotFoundException } from '@nestjs/common';

describe('RegistrationsService', () => {
  let service: RegistrationsService;

  const prismaMock = {
    registration: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    ticketCategory: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get(RegistrationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('filters registrations by user ID', async () => {
    prismaMock.registration.findMany.mockResolvedValue([]);

    const result = await service.findUserRegistrations('user_1');

    expect(result).toEqual([]);

    expect(prismaMock.registration.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user_1',
        },
      }),
    );
  });

  it('returns a registration belonging to the authenticated user', async () => {
    const registration = {
      id: 'reg_1',
      userId: 'user_1',
      status: 'CONFIRMED',
    };

    prismaMock.registration.findFirst.mockResolvedValue(registration);

    const result = await service.findOne('reg_1', 'user_1');

    expect(result).toEqual(registration);

    expect(prismaMock.registration.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'reg_1',
          userId: 'user_1',
        },
        select: expect.objectContaining({
          event: expect.any(Object),
          ticketCategory: expect.any(Object),
          ticket: expect.any(Object),
        }),
      }),
    );
  });

  it('rejects access to another user registration', async () => {
    prismaMock.registration.findFirst.mockResolvedValue(null);

    await expect(service.findOne('reg_2', 'user_1')).rejects.toThrow(
      NotFoundException,
    );

    expect(prismaMock.registration.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'reg_2',
          userId: 'user_1',
        },
      }),
    );
  });
});
