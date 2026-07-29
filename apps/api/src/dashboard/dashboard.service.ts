import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getDashboard(organizationId: string) {
    const totalEvents = await this.prisma.event.count({
      where: {
        organizationId,
      },
    });

    const totalRegistrations = await this.prisma.registration.count({
      where: {
        event: {
          organizationId,
        },
      },
    });

    const ticketsSold = await this.prisma.registration.count({
  where:{
    event:{
      organizationId
    }
  }
});

    const checkedIn = await this.prisma.registration.count({
  where: {
    checkedIn: true,
    event: {
      organizationId,
    },
  },
});

    const pendingPayments = await this.prisma.payment.count({
      where: {
        status: 'PENDING',
        registration: {
          event: {
            organizationId,
          },
        },
      },
    });

    const revenue = await this.prisma.payment.aggregate({
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
    });

    const upcomingEvents = await this.prisma.event.count({
      where: {
        organizationId,
        startDate: {
          gt: new Date(),
        },
      },
    });

    return {
      totalEvents,
      totalRegistrations,
      ticketsSold,
      checkedIn,
      pendingPayments,
      revenue: revenue._sum.amount ?? 0,
      upcomingEvents,
    };
  }

  async getRecentRegistrations(
    organizationId: string,
  ) {
    const registrations =
      await this.prisma.registration.findMany({
        where: {
          event: {
            organizationId,
          },
        },
        include: {
          user: true,
          event: true,
          ticketCategory: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

    return registrations.map((registration) => ({
      id: registration.id,
      attendee:
        `${registration.user.firstName ?? ''} ${registration.user.lastName ?? ''}`.trim(),
      email: registration.user.email,
      event: registration.event.name,
      ticketType: registration.ticketCategory.name,
      status: registration.status,
      registeredAt: registration.createdAt,
    }));
  }
}