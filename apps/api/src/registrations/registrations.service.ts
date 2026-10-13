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

    const existing = await this.prisma.registration.findFirst({
      where: {
        userId,
        eventId: dto.eventId,
        ticketCategoryId,
      },
    });

    if (existing) {
      throw new BadRequestException('You already registered for this ticket');
    }

    const registration = await this.prisma.$transaction(async (tx) => {
      const ticketCategory = await tx.ticketCategory.findUnique({
        where: {
          id: ticketCategoryId,
        },
      });

      if (!ticketCategory) {
        throw new BadRequestException('Ticket category not found');
      }

      if (ticketCategory.sold >= ticketCategory.quantity) {
        throw new BadRequestException('Tickets sold out');
      }

      const created = await tx.registration.create({
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

      await tx.ticketCategory.update({
        where: {
          id: ticketCategoryId,
        },

        data: {
          sold: {
            increment: 1,
          },
        },
      });

      return created;
    });

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
