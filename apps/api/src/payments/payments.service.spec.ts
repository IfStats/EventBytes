
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
});
