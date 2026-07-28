import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Injectable()
export class RegistrationsService {

  constructor(
  private prisma: PrismaService,
) {}

  async create(
  userId: string,
  dto: CreateRegistrationDto
) {

  const ticketCategoryId = dto.ticketTypeId;

  const registration = await this.prisma.$transaction(async (tx) => {

    const ticketCategory = await tx.ticketCategory.findUnique({
      where: {
        id: ticketCategoryId
      }
    });

    if (!ticketCategory) {
      throw new BadRequestException(
        'Ticket category not found'
      );
    }

    if (ticketCategory.sold >= ticketCategory.quantity) {
      throw new BadRequestException(
        'Tickets sold out'
      );
    }

    const registration = await tx.registration.create({
      data: {
        userId,
        eventId: dto.eventId,
        ticketCategoryId,
        status: 'PENDING_PAYMENT'
      }
    });

    await tx.ticketCategory.update({
      where: {
        id: ticketCategoryId
      },
      data: {
        sold: {
          increment: 1
        }
      }
    });

    return registration;

  });


  return {
    registration
  };

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