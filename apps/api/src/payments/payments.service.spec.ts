import { NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { createHmac } from 'crypto';

import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from '../tickets/tickets.service';
import { MailService } from '../mail/mail.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const prismaMock = {
    $transaction: jest.fn(),

    registration: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },

    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },

    ticketEmailOutbox: {
      update: jest.fn(),
    },
  };

  const ticketsServiceMock = {
    issueTicket: jest.fn(),
  };

  const mailServiceMock = {
    sendTicket: jest.fn(),
  };

  const httpServiceMock = {
    axiosRef: {
      get: jest.fn(),
      post: jest.fn(),
    },
  };

  const configServiceMock = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prismaMock.ticketEmailOutbox.update.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: TicketsService,
          useValue: ticketsServiceMock,
        },
        {
          provide: MailService,
          useValue: mailServiceMock,
        },
        {
          provide: HttpService,
          useValue: httpServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects payment initialization for a missing registration', async () => {
    prismaMock.registration.findUnique.mockResolvedValue(null);

    await expect(
      service.initialize('user_1', 'missing_registration'),
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.registration.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'missing_registration',
        },
      }),
    );
  });

  it('rejects unsupported payment providers', async () => {
    prismaMock.registration.findUnique.mockResolvedValue({
      id: 'reg_1',
      userId: 'user_1',
      payments: [],
      user: {
        email: 'buyer@example.com',
      },
      ticketCategory: {
        price: 50,
      },
      event: {
        organization: {
          country: {
            currency: 'GHS',
            paymentProvider: 'FLUTTERWAVE',
          },
        },
      },
    });

    await expect(service.initialize('user_1', 'reg_1')).rejects.toThrow(
      'The configured payment provider is not yet supported',
    );

    expect(httpServiceMock.axiosRef.post).not.toHaveBeenCalled();

    expect(prismaMock.payment.create).not.toHaveBeenCalled();
  });

  it('initializes Paystack using the configured currency', async () => {
    prismaMock.registration.findUnique.mockResolvedValue({
      id: 'reg_1',
      userId: 'user_1',
      payments: [],
      user: {
        email: 'buyer@example.com',
      },
      ticketCategory: {
        price: 50,
      },
      event: {
        organization: {
          country: {
            currency: 'GHS',
            paymentProvider: 'PAYSTACK',
          },
        },
      },
    });

    configServiceMock.get.mockReturnValue('test_secret');

    httpServiceMock.axiosRef.post.mockResolvedValue({
      data: {
        data: {
          authorization_url: 'https://checkout.paystack.com/test',
        },
      },
    });

    prismaMock.payment.create.mockResolvedValue({
      id: 'payment_1',
    });

    await service.initialize('user_1', 'reg_1');

    expect(httpServiceMock.axiosRef.post).toHaveBeenCalledWith(
      'https://api.paystack.co/transaction/initialize',
      expect.objectContaining({
        email: 'buyer@example.com',
        currency: 'GHS',
        amount: '5000',
        reference: expect.stringMatching(/^EVT-[0-9a-f-]+$/),
      }),
      expect.any(Object),
    );

    expect(prismaMock.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        registrationId: 'reg_1',
        currency: 'GHS',
        provider: 'PAYSTACK',
        status: 'PENDING',
      }),
    });
  });

  it('rejects a webhook with an invalid signature', async () => {
    const payload = {
      event: 'charge.success',
      data: {
        reference: 'EVT-test123',
      },
    };

    const rawBody = Buffer.from(JSON.stringify(payload));

    configServiceMock.get.mockReturnValue('test_secret');

    await expect(
      service.webhook(payload, '0'.repeat(128), rawBody),
    ).rejects.toThrow('Invalid webhook signature');

    expect(httpServiceMock.axiosRef.get).not.toHaveBeenCalled();
  });

  it('accepts a signed non-payment webhook without processing payment', async () => {
    const payload = {
      event: 'transfer.success',
      data: {
        reference: 'EVT-test123',
      },
    };

    const rawBody = Buffer.from(JSON.stringify(payload));

    const secret = 'test_secret';

    const signature = createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    configServiceMock.get.mockReturnValue(secret);

    await expect(service.webhook(payload, signature, rawBody)).resolves.toEqual(
      {
        message: 'Event ignored',
      },
    );

    expect(prismaMock.payment.update).not.toHaveBeenCalled();

    expect(ticketsServiceMock.issueTicket).not.toHaveBeenCalled();
  });

  it('rejects verification by another user', async () => {
    prismaMock.payment.findUnique.mockResolvedValue({
      id: 'payment_1',
      reference: 'EVT-test123',
      provider: 'PAYSTACK',
      amount: 50,
      currency: 'GHS',
      registration: {
        userId: 'owner_1',
      },
    });

    await expect(service.verify('EVT-test123', 'other_user')).rejects.toThrow(
      'Access denied',
    );

    expect(httpServiceMock.axiosRef.get).not.toHaveBeenCalled();

    expect(prismaMock.payment.update).not.toHaveBeenCalled();
  });

  it.each([
    [
      'reference',
      {
        reference: 'EVT-wrong',
        amount: 5000,
        currency: 'GHS',
      },
    ],
    [
      'amount',
      {
        reference: 'EVT-test123',
        amount: 1000,
        currency: 'GHS',
      },
    ],
    [
      'currency',
      {
        reference: 'EVT-test123',
        amount: 5000,
        currency: 'NGN',
      },
    ],
  ])('rejects mismatched Paystack %s', async (_field, details) => {
    prismaMock.payment.findUnique.mockResolvedValue({
      id: 'payment_1',
      reference: 'EVT-test123',
      provider: 'PAYSTACK',
      status: 'PENDING',
      amount: 50,
      currency: 'GHS',
      registration: {
        userId: 'user_1',
        user: {
          email: 'buyer@example.com',
        },
      },
    });

    configServiceMock.get.mockReturnValue('test_secret');

    httpServiceMock.axiosRef.get.mockResolvedValue({
      data: {
        status: true,
        data: {
          status: 'success',
          ...details,
        },
      },
    });

    await expect(service.verify('EVT-test123', 'user_1')).rejects.toThrow(
      'Payment details do not match the original transaction',
    );

    expect(prismaMock.payment.update).not.toHaveBeenCalled();

    expect(prismaMock.registration.update).not.toHaveBeenCalled();

    expect(ticketsServiceMock.issueTicket).not.toHaveBeenCalled();
  });

  describe('atomic payment fulfillment', () => {
    const reference = 'EVT-test123';

    const ticket = {
      id: 'ticket_1',
      registrationId: 'reg_1',
      ticketNumber: 'EVT-2026-existing',
      qrToken: 'existing-qr-token',
    };

    const transaction = {
      reference,
      amount: 5000,
      currency: 'GHS',
      status: 'success',
    };

    let txMock: {
      payment: {
        updateMany: jest.Mock;
        findUnique: jest.Mock;
      };
      registration: {
        updateMany: jest.Mock;
      };
      ticket: {
        findUnique: jest.Mock;
        create: jest.Mock;
      };
      ticketEmailOutbox: {
        create: jest.Mock;
      };
    };

    beforeEach(() => {
      txMock = {
        payment: {
          updateMany: jest.fn(),
          findUnique: jest.fn(),
        },
        registration: {
          updateMany: jest.fn(),
        },
        ticket: {
          findUnique: jest.fn(),
          create: jest.fn(),
        },
        ticketEmailOutbox: {
          create: jest.fn().mockResolvedValue({
            id: 'outbox_1',
            ticketId: ticket.id,
          }),
        },
      };

      prismaMock.$transaction.mockImplementation(async (callback) =>
        callback(txMock),
      );

      prismaMock.payment.findUnique.mockResolvedValue({
        id: 'payment_1',
        reference,
        amount: 50,
        currency: 'GHS',
        provider: 'PAYSTACK',
        status: 'PENDING',
        registrationId: 'reg_1',
        registration: {
          id: 'reg_1',
          userId: 'user_1',
          user: {
            email: 'buyer@example.com',
          },
          event: {
            name: 'Test Event',
          },
        },
      });

      configServiceMock.get.mockReturnValue('test_secret');

      httpServiceMock.axiosRef.get.mockResolvedValue({
        data: {
          status: true,
          data: transaction,
        },
      });

      mailServiceMock.sendTicket.mockResolvedValue({
        data: {
          id: 'email_1',
        },
        error: null,
      });
    });

    it('confirms payment and issues ticket atomically', async () => {
      txMock.payment.updateMany.mockResolvedValue({
        count: 1,
      });

      txMock.registration.updateMany.mockResolvedValue({
        count: 1,
      });

      txMock.ticket.create.mockResolvedValue(ticket);

      // Execute payment verification first.
      const result = await service.verify(reference, 'user_1');

      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);

      expect(txMock.payment.updateMany).toHaveBeenCalledTimes(1);

      expect(txMock.registration.updateMany).toHaveBeenCalledTimes(1);

      expect(txMock.ticket.create).toHaveBeenCalledTimes(1);

      // Ticket and email job must be created
      // inside the same transaction.
      expect(txMock.ticketEmailOutbox.create).toHaveBeenCalledTimes(1);

      expect(txMock.ticketEmailOutbox.create).toHaveBeenCalledWith({
        data: {
          ticketId: ticket.id,
        },
      });

      expect(result.message).toBe('Payment verified');

      expect(result.emailDelivery).toBe('accepted');

      expect(mailServiceMock.sendTicket).toHaveBeenCalledTimes(1);

      // The accepted delivery is persisted.
      expect(prismaMock.ticketEmailOutbox.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            ticketId: ticket.id,
          },
          data: expect.objectContaining({
            status: 'SENT',
          }),
        }),
      );
    });

    it('does not reissue tickets for an already-paid payment', async () => {
      txMock.payment.updateMany.mockResolvedValue({
        count: 0,
      });

      txMock.payment.findUnique.mockResolvedValue({
        status: 'PAID',
      });

      txMock.ticket.findUnique.mockResolvedValue(ticket);

      const result = await service.verify(reference, 'user_1');

      expect(result.message).toBe('Payment already processed');

      expect(txMock.ticket.create).not.toHaveBeenCalled();

      expect(txMock.ticketEmailOutbox.create).not.toHaveBeenCalled();

      expect(prismaMock.ticketEmailOutbox.update).not.toHaveBeenCalled();

      expect(mailServiceMock.sendTicket).not.toHaveBeenCalled();
    });

    it('rejects a second payment for an already-fulfilled registration', async () => {
      txMock.payment.updateMany.mockResolvedValue({
        count: 1,
      });

      txMock.registration.updateMany.mockResolvedValue({
        count: 0,
      });

      await expect(service.verify(reference, 'user_1')).rejects.toThrow(
        'Registration already fulfilled; payment requires reconciliation',
      );

      expect(txMock.ticket.create).not.toHaveBeenCalled();

      expect(txMock.ticketEmailOutbox.create).not.toHaveBeenCalled();

      expect(prismaMock.ticketEmailOutbox.update).not.toHaveBeenCalled();

      expect(mailServiceMock.sendTicket).not.toHaveBeenCalled();
    });
  });
});
