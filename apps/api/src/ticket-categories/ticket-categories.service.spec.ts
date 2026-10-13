import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { TicketCategoriesService } from './ticket-categories.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TicketCategoriesService', () => {
  let service: TicketCategoriesService;

  const prismaMock = {
    event: {
      findFirst: jest.fn(),
    },
    ticketCategory: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        TicketCategoriesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get(TicketCategoriesService);
  });

  it('rejects category creation for an event outside the organization', async () => {
    prismaMock.event.findFirst.mockResolvedValue(null);

    await expect(
      service.create('org_1', 'event_2', {
        name: 'VIP',
        price: 100,
        quantity: 50,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.event.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'event_2',
        organizationId: 'org_1',
      },
      select: {
        id: true,
      },
    });

    expect(prismaMock.ticketCategory.create).not.toHaveBeenCalled();
  });

  it('creates a category for an event in the organization', async () => {
    prismaMock.event.findFirst.mockResolvedValue({
      id: 'event_1',
    });

    prismaMock.ticketCategory.create.mockResolvedValue({
      id: 'cat_1',
      eventId: 'event_1',
    });

    await service.create('org_1', 'event_1', {
      name: 'VIP',
      price: 100,
      quantity: 50,
    });

    expect(prismaMock.ticketCategory.create).toHaveBeenCalledWith({
      data: {
        eventId: 'event_1',
        name: 'VIP',
        price: 100,
        quantity: 50,
      },
    });
  });

  it('rejects deletion of a category outside the organization', async () => {
    prismaMock.ticketCategory.findFirst.mockResolvedValue(null);

    await expect(service.delete('org_1', 'cat_2')).rejects.toThrow(
      NotFoundException,
    );

    expect(prismaMock.ticketCategory.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'cat_2',
        event: {
          organizationId: 'org_1',
        },
      },
      select: {
        id: true,
      },
    });

    expect(prismaMock.ticketCategory.deleteMany).not.toHaveBeenCalled();
  });

  it('rejects deletion when the category has registrations', async () => {
    prismaMock.ticketCategory.findFirst.mockResolvedValue({
      id: 'cat_1',
    });

    prismaMock.ticketCategory.deleteMany.mockResolvedValue({
      count: 0,
    });

    await expect(service.delete('org_1', 'cat_1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('deletes an unused category belonging to the organization', async () => {
    prismaMock.ticketCategory.findFirst.mockResolvedValue({
      id: 'cat_1',
    });

    prismaMock.ticketCategory.deleteMany.mockResolvedValue({
      count: 1,
    });

    const result = await service.delete('org_1', 'cat_1');

    expect(prismaMock.ticketCategory.deleteMany).toHaveBeenCalledWith({
      where: {
        id: 'cat_1',
        event: {
          organizationId: 'org_1',
        },
        registrations: {
          none: {},
        },
      },
    });

    expect(result).toEqual({
      message: 'Ticket category deleted',
    });
  });
});
