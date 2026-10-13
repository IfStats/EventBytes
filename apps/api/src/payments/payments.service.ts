import {
  PaymentProvider,
  PaymentStatus,
  RegistrationStatus,
} from '../generated/prisma/client';

import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

import QRCode from 'qrcode';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from '../tickets/tickets.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ticketsService: TicketsService,
    private readonly mailService: MailService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async initialize(userId: string, registrationId: string) {
    const registration = await this.prisma.registration.findUnique({
      where: {
        id: registrationId,
      },
      include: {
        user: true,
        ticketCategory: true,
        payments: true,
        event: {
          include: {
            organization: {
              include: {
                country: true,
              },
            },
          },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    if (registration.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const paid = registration.payments.find(
      (payment) => payment.status === PaymentStatus.PAID,
    );

    const country = registration.event.organization.country;

    const currency = country.currency;
    const provider = country.paymentProvider;

    if (!provider) {
      throw new BadRequestException(
        'Payment provider not configured for organizer country',
      );
    }

    if (provider !== PaymentProvider.PAYSTACK) {
      throw new BadRequestException(
        'The configured payment provider is not yet supported',
      );
    }

    if (paid) {
      throw new BadRequestException('Registration already paid');
    }

    // Only active, unpaid reservations may start checkout.
    if (
      registration.status !== RegistrationStatus.PENDING_PAYMENT ||
      registration.reservationReleasedAt != null
    ) {
      throw new ConflictException(
        'Registration is no longer available for payment',
      );
    }

    // Null supports legacy registrations created before
    // reservation expiry was introduced.
    if (
      registration.reservationExpiresAt !== null &&
      registration.reservationExpiresAt !== undefined &&
      registration.reservationExpiresAt.getTime() <= Date.now()
    ) {
      throw new ConflictException(
        'Ticket reservation has expired. Please register again.',
      );
    }

    const secret = this.configService.get<string>('PAYSTACK_SECRET_KEY');

    if (!secret) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }

    const reference = `EVT-${randomUUID()}`;

    const amount = Math.round(registration.ticketCategory.price * 100);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new BadRequestException('Invalid payment amount');
    }

    const response = await this.httpService.axiosRef.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: registration.user.email,
        amount: String(amount),
        currency,
        reference,
        callback_url: process.env.PAYSTACK_CALLBACK_URL,
      },
      {
        headers: {
          Authorization: `Bearer ${secret}`,
        },
      },
    );

    await this.prisma.payment.create({
      data: {
        registrationId,
        amount: registration.ticketCategory.price,
        currency,
        reference,
        provider,
        status: PaymentStatus.PENDING,
      },
    });

    return {
      authorizationUrl: response.data?.data?.authorization_url,
      reference,
    };
  }

  async verify(reference: string, userId?: string) {
    if (
      typeof reference !== 'string' ||
      !/^[A-Za-z0-9._=-]{1,100}$/.test(reference)
    ) {
      throw new BadRequestException('Invalid payment reference');
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
      throw new NotFoundException('Payment not found');
    }

    if (userId !== undefined && payment.registration.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (payment.provider !== PaymentProvider.PAYSTACK) {
      throw new BadRequestException('Payment provider mismatch');
    }

    const secret = this.configService.get<string>('PAYSTACK_SECRET_KEY');

    if (!secret) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }

    // Never issue tickets based solely on a callback
    // or webhook payload. Verify against Paystack.

    const response = await this.httpService.axiosRef.get(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${secret}`,
        },
      },
    );

    const transaction = response.data?.data;

    if (response.data?.status !== true || transaction?.status !== 'success') {
      throw new BadRequestException('Payment not successful');
    }

    const expectedAmount = Math.round(payment.amount * 100);

    if (!Number.isSafeInteger(expectedAmount) || expectedAmount <= 0) {
      throw new BadRequestException('Invalid stored payment amount');
    }

    if (
      transaction.reference !== payment.reference ||
      transaction.currency !== payment.currency ||
      typeof transaction.amount !== 'number' ||
      transaction.amount !== expectedAmount
    ) {
      throw new BadRequestException(
        'Payment details do not match the original transaction',
      );
    }

    // Payment confirmation, registration confirmation,
    // ticket creation and outbox creation are atomic.

    const result = await this.prisma.$transaction(
      async (tx) => {
        const claimedPayment = await tx.payment.updateMany({
          where: {
            id: payment.id,
            status: PaymentStatus.PENDING,
          },
          data: {
            status: PaymentStatus.PAID,
            providerReference: transaction.reference,
            paidAt: new Date(),
            metadata: transaction,
          },
        });

        // An already-paid reference must not issue
        // another ticket or enqueue another email.

        if (claimedPayment.count === 0) {
          const currentPayment = await tx.payment.findUnique({
            where: {
              id: payment.id,
            },
            select: {
              status: true,
            },
          });

          if (currentPayment?.status !== PaymentStatus.PAID) {
            throw new ConflictException(
              'Payment cannot be confirmed in its current state',
            );
          }

          const existingTicket = await tx.ticket.findUnique({
            where: {
              registrationId: payment.registrationId,
            },
          });

          if (!existingTicket) {
            throw new ConflictException(
              'Paid payment requires ticket reconciliation',
            );
          }

          return {
            newlyIssued: false,
            ticket: existingTicket,
          };
        }

        const claimedRegistration = await tx.registration.updateMany({
          where: {
            id: payment.registrationId,
            status: RegistrationStatus.PENDING_PAYMENT,
          },
          data: {
            status: RegistrationStatus.CONFIRMED,
          },
        });

        if (claimedRegistration.count === 0) {
          throw new ConflictException(
            'Registration already fulfilled; payment requires reconciliation',
          );
        }

        const ticket = await tx.ticket.create({
          data: {
            registrationId: payment.registrationId,
            ticketNumber: `EVT-${new Date().getUTCFullYear()}-${randomUUID()}`,
            qrToken: randomUUID(),
          },
        });

        // Create the email job in the SAME transaction.
        // If this fails, payment and ticket creation roll back.
        await tx.ticketEmailOutbox.create({
          data: {
            ticketId: ticket.id,
          },
        });

        return {
          newlyIssued: true,
          ticket,
        };
      },
      {
        maxWait: 20_000,
        timeout: 20_000,
      },
    );

    // All external operations happen after commit.

    const ticketNumber = result.ticket.ticketNumber;

    const qrToken = result.ticket.qrToken;

    const qrCode = await QRCode.toDataURL(
      JSON.stringify({
        ticketNumber,
        qrToken,
        registrationId: payment.registrationId,
      }),
    );

    const ticket = {
      ticket: result.ticket,
      ticketNumber,
      qrToken,
      qrCode,
    };

    // Temporary direct-email delivery.
    // Do not activate the retry worker until
    // this delivery path has been coordinated
    // with the worker to prevent duplicate sends.

    const emailDelivery: 'accepted' | 'failed' | 'not_required' =
      result.newlyIssued
        ? await (async (): Promise<'accepted' | 'failed'> => {
            try {
              const delivery = await this.mailService.sendTicket(
                payment.registration.user.email,
                ticket,
                payment.registration.event,
              );

              if (
                delivery &&
                typeof delivery === 'object' &&
                'error' in delivery &&
                delivery.error
              ) {
                throw new Error('Mail provider rejected ticket email');
              }

              return 'accepted';
            } catch (error) {
              this.logger.error(
                `Ticket email failed for payment ${payment.id}`,
                error instanceof Error ? error.stack : String(error),
              );

              return 'failed';
            }
          })()
        : 'not_required';

    // Persist the result separately.
    // Failure to update email status must not
    // reverse an already-confirmed payment.

    if (result.newlyIssued) {
      try {
        await this.prisma.ticketEmailOutbox.update({
          where: {
            ticketId: result.ticket.id,
          },
          data:
            emailDelivery === 'accepted'
              ? {
                  status: 'SENT',
                  attempts: {
                    increment: 1,
                  },
                  sentAt: new Date(),
                  lastError: null,
                  leaseUntil: null,
                }
              : {
                  status: 'FAILED',
                  attempts: {
                    increment: 1,
                  },
                  nextAttemptAt: new Date(Date.now() + 5 * 60_000),
                  lastError: 'Initial email delivery failed',
                  leaseUntil: null,
                },
        });
      } catch (error) {
        this.logger.error(
          `Failed to persist email delivery status for ticket ${result.ticket.id}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    return {
      message: result.newlyIssued
        ? 'Payment verified'
        : 'Payment already processed',
      ticket,
      emailDelivery,
    };
  }

  async webhook(payload: unknown, signature?: string, rawBody?: Buffer) {
    const secret = this.configService.get<string>('PAYSTACK_SECRET_KEY');

    if (!secret) {
      throw new Error('PAYSTACK_SECRET_KEY is not configured');
    }

    if (
      !Buffer.isBuffer(rawBody) ||
      typeof signature !== 'string' ||
      !/^[0-9a-f]{128}$/i.test(signature)
    ) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const expectedSignature = createHmac('sha512', secret)
      .update(rawBody)
      .digest();

    const receivedSignature = Buffer.from(signature, 'hex');

    if (!timingSafeEqual(expectedSignature, receivedSignature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (!payload || typeof payload !== 'object') {
      throw new BadRequestException('Invalid webhook payload');
    }

    const event = payload as {
      event?: unknown;
      data?: {
        reference?: unknown;
      };
    };

    if (event.event !== 'charge.success') {
      return {
        message: 'Event ignored',
      };
    }

    const reference = event.data?.reference;

    if (
      typeof reference !== 'string' ||
      !/^[A-Za-z0-9._=-]{1,100}$/.test(reference)
    ) {
      throw new BadRequestException('Invalid payment reference');
    }

    // A valid signature authenticates the webhook,
    // but Paystack's verification API remains
    // authoritative for payment confirmation.

    return this.verify(reference);
  }
}
