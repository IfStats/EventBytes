import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {

  constructor(
    private prisma: PrismaService,
  ) {}


  async create(
    organizationId: string,
    dto: CreateEventDto,
  ) {

    const slug = dto.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');


    return this.prisma.event.create({
      data: {
        organizationId,
        name: dto.name,
        slug,
        description: dto.description,
        venue: dto.venue,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
    });

  }


  async getAttendees(eventId: string) {

    const registrations =
      await this.prisma.registration.findMany({

        where:{
          eventId,
        },

        include:{
          user:true,
          ticketCategory:true,
          ticket:true,
        },

        orderBy:{
          createdAt:'desc',
        },

      });


    return registrations.map((registration)=>({

      id: registration.id,

      attendee:
        `${registration.user.firstName ?? ''} ${registration.user.lastName ?? ''}`
        .trim(),

      email:
        registration.user.email,

      ticketType:
        registration.ticketCategory.name,

      registrationStatus:
        registration.status,

      checkedIn:
        registration.checkedIn,

      ticketNumber:
        registration.ticket?.ticketNumber ?? null,

      registeredAt:
        registration.createdAt,

    }));

  }


  async findAll(
    organizationId:string
  ){

    return this.prisma.event.findMany({

      where:{
        organizationId
      },

      include:{
        ticketCategories:true
      }

    });

  }

}