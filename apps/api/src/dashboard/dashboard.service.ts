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

  async getRevenueAnalytics(
  organizationId: string,
) {
  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  );

  const [
    todayRevenue,
    weekRevenue,
    monthRevenue,
    totalRevenue,
  ] = await Promise.all([
    this.prisma.payment.aggregate({
      where: {
        status: 'PAID',
        createdAt: {
          gte: today,
        },
        registration: {
          event: {
            organizationId,
          },
        },
      },
      _sum: {
        amount: true,
      },
    }),

    this.prisma.payment.aggregate({
      where: {
        status: 'PAID',
        createdAt: {
          gte: weekStart,
        },
        registration: {
          event: {
            organizationId,
          },
        },
      },
      _sum: {
        amount: true,
      },
    }),

    this.prisma.payment.aggregate({
      where: {
        status: 'PAID',
        createdAt: {
          gte: monthStart,
        },
        registration: {
          event: {
            organizationId,
          },
        },
      },
      _sum: {
        amount: true,
      },
    }),

    this.prisma.payment.aggregate({
      where: {
        status: 'PAID',
        registration: {
          event: {
            organizationId,
          },
        },
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  return {
    today: todayRevenue._sum.amount ?? 0,
    thisWeek: weekRevenue._sum.amount ?? 0,
    thisMonth: monthRevenue._sum.amount ?? 0,
    allTime: totalRevenue._sum.amount ?? 0,
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

  async getEventPerformance(
  organizationId: string,
) {

  const events =
    await this.prisma.event.findMany({

      where: {
        organizationId,
      },

      include: {

        registrations: {
          include: {
            ticket: true,
            payments: true,
          },
        },

      },

      orderBy: {
        createdAt: 'desc',
      },

    });


  return events.map((event) => {

    const totalRegistrations =
      event.registrations.length;


    const ticketsSold =
      event.registrations.filter(
        (registration) =>
          registration.ticket !== null,
      ).length;


    const checkedIn =
      event.registrations.filter(
        (registration) =>
          registration.checkedIn,
      ).length;


    const attendanceRate =
      totalRegistrations === 0
        ? 0
        :
        Number(
          (
            (checkedIn / totalRegistrations)
            * 100
          ).toFixed(2)
        );


    const revenue =
      event.registrations
        .flatMap(
          registration =>
            registration.payments,
        )
        .filter(
          payment =>
            payment.status === 'PAID',
        )
        .reduce(
          (sum, payment) =>
            sum + payment.amount,
          0,
        );


    return {

      eventId: event.id,

      eventName:
        event.name,

      totalRegistrations,

      ticketsSold,

      checkedIn,

      attendanceRate,

      revenue,

    };

  });

}

async getTicketSales(
  organizationId: string,
) {

  const categories =
    await this.prisma.ticketCategory.findMany({

      where: {
        event: {
          organizationId,
        },
      },

      include: {
        event: true,
      },

      orderBy: {
        createdAt: 'desc',
      },

    });


  return categories.map((category) => ({

    ticketCategory:
      category.name,

    event:
      category.event.name,

    price:
      category.price,

    quantity:
      category.quantity,

    sold:
      category.sold,

    remaining:
      category.quantity - category.sold,

  }));

}

async getPaymentAnalytics(
  organizationId: string,
) {

  const [
    paid,
    pending,
    failed,
    totalTransactions,
  ] = await Promise.all([

    this.prisma.payment.count({
      where: {
        status: 'PAID',
        registration: {
          event: {
            organizationId,
          },
        },
      },
    }),

    this.prisma.payment.count({
      where: {
        status: 'PENDING',
        registration: {
          event: {
            organizationId,
          },
        },
      },
    }),

    this.prisma.payment.count({
      where: {
        status: 'FAILED',
        registration: {
          event: {
            organizationId,
          },
        },
      },
    }),

    this.prisma.payment.count({
      where: {
        registration: {
          event: {
            organizationId,
          },
        },
      },
    }),

  ]);


  return {
    paid,
    pending,
    failed,
    totalTransactions,
  };

}

}