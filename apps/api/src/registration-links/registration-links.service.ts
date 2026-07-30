import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { PaymentsService } from '../payments/payments.service';


@Injectable()
export class RegistrationLinksService {

  constructor(
  private prisma: PrismaService,
  private paymentsService: PaymentsService,
) {}


  async create(eventId: string) {

    const event =
      await this.prisma.event.findUnique({
        where: {
          id: eventId,
        },
      });


    if (!event) {
      throw new NotFoundException(
        'Event not found',
      );
    }


    const slug =
      `${event.slug}-${randomBytes(3)
      .toString('hex')}`;


    const link =
      await this.prisma.registrationLink.create({

        data: {
          eventId,
          slug,
        },

      });


    return {
      id: link.id,

      url:
      `https://eventbytes.com/r/${link.slug}`,

      slug: link.slug,

    };

  }



  async findBySlug(slug: string) {

    const link =
      await this.prisma.registrationLink.findUnique({

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

      throw new NotFoundException(
        'Registration link unavailable',
      );

    }


    return {

      event: {

        id: link.event.id,

        name:
          link.event.name,

        description:
          link.event.description,

        venue:
          link.event.venue,

        startDate:
          link.event.startDate,

        endDate:
          link.event.endDate,

        timezone:
          link.event.timezone,

      },


      tickets:
        link.event.ticketCategories.map(
          (ticket) => ({

            id:
              ticket.id,

            name:
              ticket.name,

            price:
              ticket.price,

            available:
              ticket.quantity - ticket.sold,

          }),
        ),


      registrationUrl:
        `https://eventbytes.com/r/${link.slug}`,

    };

  }



  async registerFromLink(
    slug: string,
    userId: string,
    ticketCategoryId: string,
  ) {

    const link =
      await this.prisma.registrationLink.findUnique({

        where: {
          slug,
        },

        include: {
          event: true,
        },

      });


    if (!link || !link.active) {

      throw new NotFoundException(
        'Registration link unavailable',
      );

    }



    const ticketCategory =
      await this.prisma.ticketCategory.findUnique({

        where: {
          id: ticketCategoryId,
        },

      });



    if (!ticketCategory) {

      throw new NotFoundException(
        'Ticket category not found',
      );

    }



    if (
      ticketCategory.sold >= ticketCategory.quantity
    ) {

      throw new BadRequestException(
        'Tickets sold out',
      );

    }

    const existingRegistration =
  await this.prisma.registration.findFirst({

    where: {

      userId,

      eventId: link.eventId,

      ticketCategoryId,

      status: {
        in: [
          'PENDING_PAYMENT',
          'CONFIRMED',
        ],
      },

    },

  });


if (existingRegistration) {

  throw new BadRequestException(
    'You already registered for this ticket',
  );

}



    const registration =
      await this.prisma.$transaction(

        async (tx) => {


          const created =
            await tx.registration.create({

              data: {

                userId,

                eventId:
                  link.eventId,

                ticketCategoryId,

                status:
                  'PENDING_PAYMENT',

              },

            });



          await tx.ticketCategory.update({

            where: {

              id:
                ticketCategoryId,

            },

            data: {

              sold: {

                increment: 1,

              },

            },

          });



          return created;


        },

      );



    return {

      registrationId:
        registration.id,

      event:
        link.event.name,

      ticketCategory:
        ticketCategory.name,

      amount:
        ticketCategory.price,

      status:
        registration.status,

    };

  }

}