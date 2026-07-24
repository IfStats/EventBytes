import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {

	private resend = new Resend(
		process.env.RESEND_API_KEY,
	);

	async sendTicket(
		email: string,
		ticket: any,
		event: any,
	) {
		const ticketRecord = ticket.ticket ?? ticket;
		const eventName = event?.name ?? ticketRecord?.registration?.event?.name ?? 'Event';
		const ticketNumber = ticket.ticketNumber ?? ticketRecord?.ticketNumber;
		const qrCode = ticket.qrCode ?? ticketRecord?.qrCode;

		return this.resend.emails.send({

			from: process.env.EMAIL_FROM || 'EventBytes <noreply@eventbytes.com>',

			to: email,

			subject: `Your Ticket - ${eventName}`,

			html: `
				<h1>Your Ticket</h1>

				<p>Ticket Number:</p>

				<h2>${ticketNumber}</h2>

				<img src="${qrCode}" />

				<p>Present this QR code at check-in.</p>
			`,
		});

	}

	async sendTicketEmail(
		email: string,
		ticket: any,
	) {
		return this.sendTicket(email, ticket, ticket?.registration?.event);
	}
}
