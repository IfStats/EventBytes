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
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      fields: {
        quantity: 'quantity_field_ref',
      },
    },

    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback({
        ticketCategory: {
          updateMany: prismaMock.ticketCategory.updateMany,
          findFirst: prismaMock.ticketCategory.findFirst,
        },
        registration: {
          findFirst: prismaMock.registration.findFirst,
          create: prismaMock.registration.create,
        },
      }),
    );

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

  it('atomically reserves an available ticket', async () => {
    prismaMock.ticketCategory.updateMany.mockResolvedValue({
      count: 1,
    });

    prismaMock.registration.findFirst.mockResolvedValue(null);

    prismaMock.registration.create.mockResolvedValue({
      id: 'reg_new',
      status: 'PENDING_PAYMENT',
    });

    const result = await service.create('user_1', {
      eventId: 'event_1',
      ticketTypeId: 'cat_1',
    });

    expect(prismaMock.ticketCategory.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'cat_1',
        eventId: 'event_1',
        sold: {
          lt: 'quantity_field_ref',
        },
      },
      data: {
        sold: {
          increment: 1,
        },
      },
    });

    expect(result.registration.id).toBe('reg_new');
  });

  it('rejects a sold-out category', async () => {
    prismaMock.ticketCategory.updateMany.mockResolvedValue({
      count: 0,
    });

    prismaMock.ticketCategory.findFirst.mockResolvedValue({
      id: 'cat_1',
    });

    await expect(
      service.create('user_1', {
        eventId: 'event_1',
        ticketTypeId: 'cat_1',
      }),
    ).rejects.toThrow('Tickets sold out');

    expect(prismaMock.registration.create).not.toHaveBeenCalled();
  });

  it('rejects a category belonging to another event', async () => {
    prismaMock.ticketCategory.updateMany.mockResolvedValue({
      count: 0,
    });

    prismaMock.ticketCategory.findFirst.mockResolvedValue(null);

    await expect(
      service.create('user_1', {
        eventId: 'event_1',
        ticketTypeId: 'cat_other',
      }),
    ).rejects.toThrow('Ticket category not found for this event');

    expect(prismaMock.registration.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate active registrations', async () => {
    prismaMock.ticketCategory.updateMany.mockResolvedValue({
      count: 1,
    });

    prismaMock.registration.findFirst.mockResolvedValue({
      id: 'reg_existing',
    });

    await expect(
      service.create('user_1', {
        eventId: 'event_1',
        ticketTypeId: 'cat_1',
      }),
    ).rejects.toThrow('You already registered for this ticket');

    expect(prismaMock.registration.create).not.toHaveBeenCalled();
  });
});
