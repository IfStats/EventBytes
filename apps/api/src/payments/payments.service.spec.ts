
import {
  NotFoundException,
} from "@nestjs/common";
import {
  Test,
  TestingModule,
} from "@nestjs/testing";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";

import { PaymentsService } from "./payments.service";
import { PrismaService } from "../prisma/prisma.service";
import { TicketsService } from "../tickets/tickets.service";
import { MailService } from "../mail/mail.service";

describe("PaymentsService", () => {
  let service: PaymentsService;

  const prismaMock = {
    registration: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      findUnique: jest.fn(),
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

    const module: TestingModule =
      await Test.createTestingModule({
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

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("rejects payment initialization for a missing registration", async () => {
    prismaMock.registration.findUnique.mockResolvedValue(
      null,
    );

    await expect(
      service.initialize(
        "user_1",
        "missing_registration",
      ),
    ).rejects.toThrow(NotFoundException);

    expect(
      prismaMock.registration.findUnique,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "missing_registration",
        },
      }),
    );
  });
it("rejects unsupported payment providers", async () => {
  prismaMock.registration.findUnique.mockResolvedValue({
    id: "reg_1",
    userId: "user_1",
    payments: [],
    user: { email: "buyer@example.com" },
    ticketCategory: { price: 50 },
    event: {
      organization: {
        country: {
          currency: "GHS",
          paymentProvider: "FLUTTERWAVE",
        },
      },
    },
  });

  await expect(
    service.initialize("user_1", "reg_1"),
  ).rejects.toThrow(
    "The configured payment provider is not yet supported",
  );

  expect(httpServiceMock.axiosRef.post).not.toHaveBeenCalled();
  expect(prismaMock.payment.create).not.toHaveBeenCalled();
});

it("initializes Paystack using the configured currency", async () => {
  prismaMock.registration.findUnique.mockResolvedValue({
    id: "reg_1",
    userId: "user_1",
    payments: [],
    user: { email: "buyer@example.com" },
    ticketCategory: { price: 50 },
    event: {
      organization: {
        country: {
          currency: "GHS",
          paymentProvider: "PAYSTACK",
        },
      },
    },
  });

  configServiceMock.get.mockReturnValue("test_secret");

  httpServiceMock.axiosRef.post.mockResolvedValue({
    data: {
      data: {
        authorization_url: "https://checkout.paystack.com/test",
      },
    },
  });

  prismaMock.payment.create.mockResolvedValue({
    id: "payment_1",
  });

  await service.initialize("user_1", "reg_1");

  expect(httpServiceMock.axiosRef.post).toHaveBeenCalledWith(
    "https://api.paystack.co/transaction/initialize",
    expect.objectContaining({
      email: "buyer@example.com",
      currency: "GHS",
      amount: "5000",
      reference: expect.stringMatching(/^EVT-[0-9a-f-]+$/),
    }),
    expect.any(Object),
  );

  expect(prismaMock.payment.create).toHaveBeenCalledWith({
    data: expect.objectContaining({
      registrationId: "reg_1",
      currency: "GHS",
      provider: "PAYSTACK",
      status: "PENDING",
    }),
  });
});

});
