import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketCategoryDto } from './dto/create-ticket-category.dto';

@Injectable()
export class TicketCategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(
    eventId: string,
    dto: CreateTicketCategoryDto,
  ) {
    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.prisma.ticketCategory.create({
      data: {
        eventId,
        name: dto.name,
        price: dto.price,
        quantity: dto.quantity,
      },
    });
  }

  async findAll(eventId: string) {
    return this.prisma.ticketCategory.findMany({
      where: {
        eventId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.ticketCategory.findUnique({
      where: {
        id,
      },
    });

    if (!category) {
      throw new NotFoundException('Ticket category not found');
    }

    return category;
  }
}