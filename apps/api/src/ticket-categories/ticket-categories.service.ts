import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketCategoryDto } from './dto/create-ticket-category.dto';

@Injectable()
export class TicketCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    organizationId: string,
    eventId: string,
    dto: CreateTicketCategoryDto,
  ) {
    const event = await this.prisma.event.findFirst({
      where: {
        id: eventId,
        organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found in this organization');
    }

    return this.prisma.ticketCategory.create({
      data: {
        eventId: event.id,
        name: dto.name,
        price: dto.price,
        quantity: dto.quantity,
      },
    });
  }

  async findByEvent(eventId: string) {
    return this.prisma.ticketCategory.findMany({
      where: {
        eventId,
      },
      orderBy: {
        price: 'asc',
      },
    });
  }

  async delete(organizationId: string, id: string) {
    const category = await this.prisma.ticketCategory.findFirst({
      where: {
        id,
        event: {
          organizationId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Ticket category not found');
    }

    // Only delete a category if it still has
    // no associated registrations.
    const deleted = await this.prisma.ticketCategory.deleteMany({
      where: {
        id: category.id,
        event: {
          organizationId,
        },
        registrations: {
          none: {},
        },
      },
    });

    if (deleted.count !== 1) {
      throw new ConflictException(
        'Cannot delete a ticket category with registrations',
      );
    }

    return {
      message: 'Ticket category deleted',
    };
  }
}
