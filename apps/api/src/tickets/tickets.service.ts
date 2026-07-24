import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {

	constructor(
		private prisma: PrismaService
	) {}

	private async generateTicketNumber() {
		const year = new Date().getFullYear();
		const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
		const startOfNextYear = new Date(`${year + 1}-01-01T00:00:00.000Z`);

		const ticketCount = await this.prisma.ticket.count({
			where: {
				createdAt: {
					gte: startOfYear,
					lt: startOfNextYear,
				},
			},
		});

		return `EVT-${year}-${String(ticketCount + 1).padStart(6, '0')}`;
	}

	async issueTicket(registrationId: string) {
		const registration = await this.prisma.registration.findUnique({
			where: {
				id: registrationId,
			},
		});

		if (!registration) {
			throw new NotFoundException('Registration not found');
		}

		// Prevent duplicate tickets
		const existing = await this.prisma.ticket.findUnique({
			where: {
				registrationId,
			},
		});

		if (existing) {
			return existing;
		}

		const ticketNumber = await this.generateTicketNumber();
		const qrToken = randomUUID();

		const ticket = await this.prisma.ticket.create({
			data: {
				registrationId,
				ticketNumber,
				qrToken,
			}
		});

		const payload = JSON.stringify({
			ticketNumber,
			qrToken,
			registrationId,
		});

		const qrCode = await QRCode.toDataURL(payload);

		return {
			ticket,

			qrCode,

			ticketNumber: ticket.ticketNumber,
			qrToken: ticket.qrToken
		};
	}

	async checkIn(ticketNumber: string) {
		const ticket = await this.prisma.ticket.findUnique({
			where: {
				ticketNumber,
			},
			include: {
				registration: {
					include: {
						user: true,
						event: true,
						ticketCategory: true,
					},
				},
			},
		});

		if (!ticket) {
			throw new NotFoundException('Ticket not found');
		}

		if (ticket.status === 'USED') {
			throw new BadRequestException('Ticket already used');
		}

		const updated = await this.prisma.ticket.update({
			where: {
				id: ticket.id,
			},
			data: {
				status: 'USED',
				checkedInAt: new Date(),
			},
		});

		return {
			message: 'Check-in successful',
			attendee: ticket.registration.user.email,
			event: ticket.registration.event.name,
			ticketCategory: ticket.registration.ticketCategory.name,
			checkedInAt: updated.checkedInAt,
		};
	}
}
