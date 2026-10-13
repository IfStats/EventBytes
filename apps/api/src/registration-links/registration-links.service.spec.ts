import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { RegistrationLinksService } from './registration-links.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';

describe('RegistrationLinksService', () => {
  let service: RegistrationLinksService;

  const prismaMock = {
    $transaction: jest.fn(),

    event: {
      findFirst: jest.fn(),
    },

    registrationLink: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },

    ticketCategory: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      fields: {
        quantity: 'quantity_field_ref',
      },
    },

    registration: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback({
        ticketCategory: {
          updateMany: prismaMock.ticketCategory.updateMany,
        },
        registration: {
          findFirst: prismaMock.registration.findFirst,
          create: prismaMock.registration.create,
        },
      }),
    );

    prismaMock.registrationLink.findUnique.mockResolvedValue({
      id: 'link_1',
      slug: 'test-event-123abc',
      active: true,
      eventId: 'event_1',
      event: {
        id: 'event_1',
        name: 'Test Event',
      },
    });

    prismaMock.ticketCategory.findUnique.mockResolvedValue({
      id: 'cat_1',
      eventId: 'event_1',
      name: 'General',
      price: 50,
    });

    const module = await Test.createTestingModule({
      providers: [
        RegistrationLinksService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: PaymentsService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get(RegistrationLinksService);
  });

  it('rejects an event outside the organization', async () => {
    prismaMock.event.findFirst.mockResolvedValue(null);

    await expect(service.create('org_1', 'event_2')).rejects.toThrow(
      NotFoundException,
    );

    expect(prismaMock.event.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'event_2',
        organizationId: 'org_1',
      },
      select: {
        id: true,
        slug: true,
      },
    });

    expect(prismaMock.registrationLink.create).not.toHaveBeenCalled();
  });

  it('creates a link for an event in its organization', async () => {
    prismaMock.event.findFirst.mockResolvedValue({
      id: 'event_1',
      slug: 'tech-conference',
    });

    prismaMock.registrationLink.create.mockImplementation(async ({ data }) => ({
      id: 'link_1',
      ...data,
    }));

    const result = await service.create('org_1', 'event_1');

    expect(prismaMock.registrationLink.create).toHaveBeenCalledWith({
      data: {
        eventId: 'event_1',
        slug: expect.stringMatching(/^tech-conference-[0-9a-f]{6}$/),
      },
    });

    expect(result.id).toBe('link_1');
    expect(result.url).toBe(`https://eventbytes.com/r/${result.slug}`);
  });

  it('rejects a category belonging to another event', async () => {
    prismaMock.ticketCategory.findUnique.mockResolvedValue({
      id: 'cat_other',
      eventId: 'event_other',
      name: 'VIP',
      price: 100,
    });

    await expect(
      service.registerFromLink('test-event-123abc', 'user_1', 'cat_other'),
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();

    expect(prismaMock.registration.create).not.toHaveBeenCalled();
  });

  it('rejects a sold-out ticket category', async () => {
    prismaMock.ticketCategory.updateMany.mockResolvedValue({
      count: 0,
    });

    await expect(
      service.registerFromLink('test-event-123abc', 'user_1', 'cat_1'),
    ).rejects.toThrow(BadRequestException);

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

    expect(prismaMock.registration.create).not.toHaveBeenCalled();
  });

  it('rejects a duplicate active registration', async () => {
    prismaMock.ticketCategory.updateMany.mockResolvedValue({
      count: 1,
    });

    prismaMock.registration.findFirst.mockResolvedValue({
      id: 'reg_existing',
    });

    await expect(
      service.registerFromLink('test-event-123abc', 'user_1', 'cat_1'),
    ).rejects.toThrow('You already registered for this ticket');

    expect(prismaMock.registration.create).not.toHaveBeenCalled();
  });

  it('atomically reserves inventory and creates a registration', async () => {
    prismaMock.ticketCategory.updateMany.mockResolvedValue({
      count: 1,
    });

    prismaMock.registration.findFirst.mockResolvedValue(null);

    prismaMock.registration.create.mockResolvedValue({
      id: 'reg_new',
      status: 'PENDING_PAYMENT',
    });

    const result = await service.registerFromLink(
      'test-event-123abc',
      'user_1',
      'cat_1',
    );

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);

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

    expect(prismaMock.registration.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'user_1',
          eventId: 'event_1',
          ticketCategoryId: 'cat_1',
          status: {
            in: ['PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN'],
          },
        },
      }),
    );

    expect(prismaMock.registration.create).toHaveBeenCalledWith({
      data: {
        userId: 'user_1',
        eventId: 'event_1',
        ticketCategoryId: 'cat_1',
        status: 'PENDING_PAYMENT',
        reservationExpiresAt: expect.any(Date),
      },
    });

    expect(result).toEqual({
      registrationId: 'reg_new',
      event: 'Test Event',
      ticketCategory: 'General',
      amount: 50,
      status: 'PENDING_PAYMENT',
    });
  });
});
