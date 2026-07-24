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

		const totalTickets = await this.prisma.ticket.count({
			where: {
				registration: {
					event: {
						organizationId,
					},
				},
			},
		});

		return {
			totalEvents,
			totalRegistrations,
			totalTickets,
		};
	}
}
