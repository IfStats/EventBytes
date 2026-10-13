import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { PaymentsService } from '../payments/payments.service';
import { getReservationExpiresAt } from '../common/utils/reservation-expiry';

@Injectable()
export class RegistrationLinksService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {}

  async create(organizationId: string, eventId: string) {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        organizationId,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found in this organization');
    }

    const slug = `${event.slug}-${randomBytes(3).toString('hex')}`;

    const link = await this.prisma.registrationLink.create({
      data: {
        eventId: event.id,
        slug,
      },
    });

    return {
      id: link.id,
      url: `https://eventbytes.com/r/${link.slug}`,
      slug: link.slug,
    };
  }

  async findBySlug(slug: string) {
    const link = await this.prisma.registrationLink.findUnique({
      where: {
        slug,
      },

      include: {
        event: {
          include: {
            ticketCategories: true,
          },
        },
      },
    });

    if (!link || !link.active) {
      throw new NotFoundException('Registration link unavailable');
    }

    return {
      event: {
        id: link.event.id,

        name: link.event.name,

        description: link.event.description,

        venue: link.event.venue,

        startDate: link.event.startDate,

        endDate: link.event.endDate,

        timezone: link.event.timezone,
      },

      tickets: link.event.ticketCategories.map((ticket) => ({
        id: ticket.id,

        name: ticket.name,

        price: ticket.price,

        available: ticket.quantity - ticket.sold,
      })),

      registrationUrl: `https://eventbytes.com/r/${link.slug}`,
    };
  }

  async registerFromLink(
    slug: string,
    userId: string,
    ticketCategoryId: string,
  ) {
    const link = await this.prisma.registrationLink.findUnique({
      where: {
        slug,
      },
      include: {
        event: true,
      },
    });

    if (!link || !link.active) {
      throw new NotFoundException('Registration link unavailable');
    }

    const ticketCategory = await this.prisma.ticketCategory.findUnique({
      where: {
        id: ticketCategoryId,
      },
      select: {
        id: true,
        eventId: true,
        name: true,
        price: true,
      },
    });

    if (!ticketCategory || ticketCategory.eventId !== link.eventId) {
      throw new NotFoundException('Ticket category not found for this event');
    }

    const registration = await this.prisma.$transaction(
      async (tx) => {
        // Reserve inventory only when capacity remains.
        const claimed = await tx.ticketCategory.updateMany({
          where: {
            id: ticketCategoryId,
            eventId: link.eventId,
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
          throw new BadRequestException('Tickets sold out');
        }

        // Check duplicates after the inventory claim.
        // The category update serializes competing claims.
        const existing = await tx.registration.findFirst({
          where: {
            userId,
            eventId: link.eventId,
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

        // Failure here rolls back the inventory claim.
        return tx.registration.create({
          data: {
            userId,
            eventId: link.eventId,
            ticketCategoryId,
            status: 'PENDING_PAYMENT',
            reservationExpiresAt: getReservationExpiresAt(),
          },
        });
      },
      {
        maxWait: 20_000,
        timeout: 20_000,
      },
    );

    return {
      registrationId: registration.id,
      event: link.event.name,
      ticketCategory: ticketCategory.name,
      amount: ticketCategory.price,
      status: registration.status,
    };
  }
}
