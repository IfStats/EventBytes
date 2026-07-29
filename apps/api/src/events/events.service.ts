import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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



  async togglePublish(
    organizationId: string,
    eventId: string,
  ) {

    const event =
      await this.prisma.event.findFirst({

        where: {

          id: eventId,

          organizationId,

        },

      });


    if (!event) {

      throw new NotFoundException(
        'Event not found',
      );

    }



    return this.prisma.event.update({

      where: {

        id: eventId,

      },

      data: {

        published: !event.published,

        status: !event.published
          ? 'PUBLISHED'
          : 'DRAFT',

      },

    });

  }




  async getAttendees(
    eventId: string,
  ) {

    const registrations =
      await this.prisma.registration.findMany({

        where: {

          eventId,

        },


        include: {

          user: true,

          ticketCategory: true,

          ticket: true,

        },


        orderBy: {

          createdAt: 'desc',

        },

      });



    return registrations.map((registration) => ({


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
    organizationId: string,
  ) {


    return this.prisma.event.findMany({

      where: {

        organizationId,

      },


      include: {

        ticketCategories: true,

      },

    });

  }





  async findPublishedEvents() {


    return this.prisma.event.findMany({

      where: {

        published: true,

      },


      orderBy: {

        startDate: 'asc',

      },


      include: {


        organization: {

          select: {

            id: true,

            name: true,

          },

        },


        ticketCategories: true,


      },


    });


  }






  async findEventBySlug(
    slug: string,
  ) {


    const event =
      await this.prisma.event.findUnique({

        where: {

          slug,

        },


        include: {


          organization: {

            select: {

              id: true,

              name: true,

            },

          },


          ticketCategories: {

            orderBy: {

              price: 'asc',

            },

          },


        },

      });



    if (!event) {

      throw new NotFoundException(
        'Event not found',
      );

    }



    return event;


  }


}