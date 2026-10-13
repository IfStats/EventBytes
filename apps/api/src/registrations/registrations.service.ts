import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Injectable()
export class RegistrationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateRegistrationDto) {
    const ticketCategoryId = dto.ticketTypeId;

    const registration = await this.prisma.$transaction(
      async (tx) => {
        // Atomically claim one available ticket.
        // PostgreSQL prevents concurrent updates from
        // overselling the same category.
        const claimed = await tx.ticketCategory.updateMany({
          where: {
            id: ticketCategoryId,
            eventId: dto.eventId,
            sold: {
              lt: this.prisma.ticketCategory.fields.quantity,
            },
          },
          data: {
            sold: {
              increment: 1,
            },
          },
        });

        if (claimed.count !== 1) {
          const category = await tx.ticketCategory.findFirst({
            where: {
              id: ticketCategoryId,
              eventId: dto.eventId,
            },
            select: {
              id: true,
            },
          });

          if (!category) {
            throw new BadRequestException(
              'Ticket category not found for this event',
            );
          }

          throw new BadRequestException('Tickets sold out');
        }

        // This check happens AFTER acquiring the
        // category's write lock. Concurrent requests
        // for the same category are serialized.
        const existing = await tx.registration.findFirst({
          where: {
            userId,
            eventId: dto.eventId,
            ticketCategoryId,
            status: {
              in: ['PENDING_PAYMENT', 'CONFIRMED', 'CHECKED_IN'],
            },
          },
          select: {
            id: true,
          },
        });

        if (existing) {
          throw new BadRequestException(
            'You already registered for this ticket',
          );
        }

        // If creation fails, the inventory increment
        // rolls back with this transaction.
        return tx.registration.create({
          data: {
            userId,
            eventId: dto.eventId,
            ticketCategoryId,
            status: 'PENDING_PAYMENT',
          },
          include: {
            event: true,
            ticketCategory: true,
          },
        });
      },
      {
        maxWait: 20_000,
        timeout: 20_000,
      },
    );

    return {
      message: 'Registration created. Awaiting payment',
      registration,
    };
  }

  async findUserRegistrations(userId: string) {
    return this.prisma.registration.findMany({
      where: {
        userId,
      },

      include: {
        event: true,

        ticketCategory: true,

        ticket: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const registration = await this.prisma.registration.findFirst({
      where: {
        id,
        userId,
      },

      select: {
        id: true,
        userId: true,
        eventId: true,
        ticketCategoryId: true,
        status: true,
        checkedIn: true,
        checkedInAt: true,
        createdAt: true,

        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            venue: true,
            bannerImage: true,
            startDate: true,
            endDate: true,
            timezone: true,
          },
        },

        ticketCategory: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },

        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            qrToken: true,
            status: true,
            issuedAt: true,
            checkedInAt: true,
          },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    return registration;
  }
}
