import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {

  constructor(
    private readonly prisma: PrismaService,
  ) {}


  async getRecentEvents(
    organizationId: string,
  ) {

    return this.prisma.event.findMany({

      where: {
        organizationId,
      },

      orderBy: {
        createdAt: 'desc',
      },

      take: 5,

      include: {
        ticketCategories: true,
        registrations: true,
      },

    });

  }


  async getAttendanceSummary(
    organizationId: string,
  ) {

    const totalRegistered =
      await this.prisma.registration.count({

        where: {
          event: {
            organizationId,
          },
        },

      });


    const checkedIn =
      await this.prisma.registration.count({

        where: {
          event: {
            organizationId,
          },
          checkedIn: true,
        },

      });


    const notCheckedIn =
      totalRegistered - checkedIn;


    const attendanceRate =
      totalRegistered === 0
        ? 0
        : Number(
            ((checkedIn / totalRegistered) * 100)
            .toFixed(2)
          );


    const recentCheckIns =
      await this.prisma.registration.findMany({

        where: {
          event: {
            organizationId,
          },
          checkedIn: true,
        },

        include: {
          user: true,
          event: true,
          ticketCategory: true,
        },

        orderBy: {
          checkedInAt: 'desc',
        },

        take: 10,

      });


    return {

      totalRegistered,

      checkedIn,

      notCheckedIn,

      attendanceRate,

      recentCheckIns:
        recentCheckIns.map((registration) => ({

          attendee:
            `${registration.user.firstName ?? ''} ${registration.user.lastName ?? ''}`
            .trim(),

          email:
            registration.user.email,

          event:
            registration.event.name,

          ticketCategory:
            registration.ticketCategory.name,

          checkedInAt:
            registration.checkedInAt,

        })),

    };

  }


  async getDashboard(
    organizationId: string,
  ) {

    const [
      totalEvents,
      publishedEvents,
      totalRegistrations,
      ticketsSold,
      checkedIn,
      pendingPayments,
      revenue,
      upcomingEvents,
      recentRegistrations,
      recentEvents,

    ] = await Promise.all([


      this.prisma.event.count({
        where:{
          organizationId,
        },
      }),


      this.prisma.event.count({
        where:{
          organizationId,
          published:true,
        },
      }),


      this.prisma.registration.count({
        where:{
          event:{
            organizationId,
          },
        },
      }),


      this.prisma.ticket.count({
        where:{
          registration:{
            event:{
              organizationId,
            },
          },
        },
      }),


      this.prisma.ticket.count({
        where:{
          status:'USED',
          registration:{
            event:{
              organizationId,
            },
          },
        },
      }),


      this.prisma.payment.count({
        where:{
          status:'PENDING',
          registration:{
            event:{
              organizationId,
            },
          },
        },
      }),


      this.prisma.payment.aggregate({

        where:{
          status:'PAID',
          registration:{
            event:{
              organizationId,
            },
          },
        },

        _sum:{
          amount:true,
        },

      }),


      this.prisma.event.count({

        where:{
          organizationId,

          startDate:{
            gt:new Date(),
          },

        },

      }),


      this.getRecentRegistrations(
        organizationId
      ),


      this.getRecentEvents(
        organizationId
      ),

    ]);


    return {

      summary: {

        totalEvents,

        publishedEvents,

        totalRegistrations,

        ticketsSold,

        checkedIn,

        pendingPayments,

        revenue:
          revenue._sum.amount ?? 0,

        upcomingEvents,

      },


      recentRegistrations,

      recentEvents,

    };

  }


  async getRecentRegistrations(
    organizationId:string,
  ) {


    const registrations =
      await this.prisma.registration.findMany({

        where:{
          event:{
            organizationId,
          },
        },


        include:{
          user:true,
          event:true,
          ticketCategory:true,
        },


        orderBy:{
          createdAt:'desc',
        },


        take:10,

      });


    return registrations.map(
      (registration)=>({

        id:
          registration.id,

        attendee:
          `${registration.user.firstName ?? ''} ${registration.user.lastName ?? ''}`
          .trim(),

        email:
          registration.user.email,

        event:
          registration.event.name,

        ticketType:
          registration.ticketCategory.name,

        status:
          registration.status,

        registeredAt:
          registration.createdAt,

      })
    );

  }

}