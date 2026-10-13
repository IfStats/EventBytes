import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { RegistrationLinksService } from './registration-links.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';

describe('RegistrationLinksService authorization', () => {
  let service: RegistrationLinksService;

  const prismaMock = {
    event: {
      findFirst: jest.fn(),
    },
    registrationLink: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

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

  it('creates a link only for an event belonging to the organization', async () => {
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
});
