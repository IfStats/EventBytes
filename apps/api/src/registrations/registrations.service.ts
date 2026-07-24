import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Injectable()
export class RegistrationsService {

  constructor(
    private prisma: PrismaService
  ) {}

  async create(
    userId: string,
    dto: CreateRegistrationDto
  ) {
    const ticketCategoryId = dto.ticketTypeId;

    const ticketCategory = await this.prisma.ticketCategory.findUnique({
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

    const registration = await this.prisma.registration.create({
      data: {
        userId,
        eventId: dto.eventId,
        ticketCategoryId,
        status: 'CONFIRMED',
      },
      include: {
        event: true,
        ticketCategory: true,
        user: true,
      },
    });

    return registration;
  }

  async findUserRegistrations(userId:string){

    return this.prisma.registration.findMany({

      where:{
        userId
      },

      include:{
        event:true,
        ticketCategory:true
      }

    });

  }

}
