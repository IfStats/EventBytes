import { PaymentStatus, RegistrationStatus } from '@prisma/client';
import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from '../tickets/tickets.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentsService {
	constructor(
		private prisma: PrismaService,
		private ticketsService: TicketsService,
		private mailService: MailService,
		private httpService: HttpService,
		private configService: ConfigService,
	) {}

	async initialize(
		userId: string,
		registrationId: string,
	) {
		const registration =
			await this.prisma.registration.findUnique({
				where: {
					id: registrationId,
				},
				include: {
					user: true,
					ticketCategory: true,
					payments: true,
				},
			});

		if (!registration) {
			throw new NotFoundException(
				'Registration not found',
			);
		}

		if (registration.userId !== userId) {
			throw new ForbiddenException('Access denied');
		}

		const paid = registration.payments.find(
			(payment) => payment.status === PaymentStatus.PAID,
		);

		if (paid) {
			throw new BadRequestException(
				'Registration already paid',
			);
		}

		// initialize Paystack here

		const reference = `EVT_${Date.now()}`;
		const amount = registration.ticketCategory.price * 100;

		const response = await this.httpService.axiosRef.post(
			'https://api.paystack.co/transaction/initialize',
			{
				email: registration.user.email,
				amount,
				reference,
				callback_url:
					process.env.PAYSTACK_CALLBACK_URL,
			},
			{
				headers: {
					Authorization:
						`Bearer ${this.configService.get('PAYSTACK_SECRET_KEY')}`,
				},
			},
		);

		await this.prisma.payment.create({
			data: {
				registrationId,
				amount: registration.ticketCategory.price,
				reference,
				provider: 'PAYSTACK',
				status: PaymentStatus.PENDING,
			},
		});

		return {
			authorizationUrl:
				response.data?.data?.authorization_url,
			reference,
		};
	}

	async verify(reference: string) {
		const response = await this.httpService.axiosRef.get(
			`https://api.paystack.co/transaction/verify/${reference}`,
			{
				headers: {
					Authorization:
						`Bearer ${this.configService.get('PAYSTACK_SECRET_KEY')}`,
				},
			},
		);

		if (!response.data.status) {
			throw new BadRequestException('Verification failed');
		}

		const payment = await this.prisma.payment.findUnique({
			where: {
				reference,
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

		if (!payment) {
			throw new NotFoundException();
		}

		if (response.data.data.status !== 'success') {
			throw new BadRequestException(
				'Payment not successful',
			);
		}

		await this.prisma.payment.update({
			where: {
				id: payment.id,
			},
			data: {
				status: PaymentStatus.PAID,
				providerReference:
					response.data.data.reference,
				paidAt: new Date(),
				metadata: response.data.data,
			},
		});

		await this.prisma.registration.update({
			where: {
				id: payment.registration.id,
			},
			data: {
				status: RegistrationStatus.CONFIRMED,
			},
		});

		const ticket =
			await this.ticketsService.issueTicket(
				payment.registrationId,
			);

		await this.mailService.sendTicket(
			payment.registration.user.email,
			ticket,
			payment.registration.event,
		);

		return {
			message: 'Payment verified',
			ticket,
		};
	}
}
