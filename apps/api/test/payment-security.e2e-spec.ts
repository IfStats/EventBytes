
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { createHmac } from "crypto";
import request from "supertest";

import { PaymentsController } from "../src/payments/payments.controller";
import { PaymentsService } from "../src/payments/payments.service";
import { TicketsController } from "../src/tickets/tickets.controller";
import { TicketsService } from "../src/tickets/tickets.service";
import { PrismaService } from "../src/prisma/prisma.service";
import { MailService } from "../src/mail/mail.service";

describe("Payment and ticket HTTP security (e2e)", () => {
  let app: INestApplication;

  const secret = "eventbytes-e2e-test-secret";

  const issueTicket = jest.fn();
  const checkIn = jest.fn();
  const sendTicket = jest.fn();
  const verifyPayment = jest.fn();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [
        PaymentsController,
        TicketsController,
      ],
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: {
            payment: {
              findUnique: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
        {
          provide: TicketsService,
          useValue: {
            issueTicket,
            checkIn,
          },
        },
        {
          provide: MailService,
          useValue: {
            sendTicket,
          },
        },
        {
          provide: HttpService,
          useValue: {
            axiosRef: {
              get: verifyPayment,
              post: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === "PAYSTACK_SECRET_KEY"
                ? secret
                : undefined,
          },
        },
      ],
    }).compile();

    app = module.createNestApplication({
      rawBody: true,
    });

    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it("accepts a correctly signed webhook using exact raw bytes", async () => {
    const rawBody = `{
  "event": "transfer.success",
  "data": {
    "reference": "EVT-e2e-test"
  }
}`;

    const signature = createHmac("sha512", secret)
      .update(Buffer.from(rawBody, "utf8"))
      .digest("hex");

    const response = await request(app.getHttpServer())
      .post("/payments/webhook")
      .set("Content-Type", "application/json")
      .set("x-paystack-signature", signature)
      .send(rawBody)
      .expect(201);

    expect(response.body).toEqual({
      message: "Event ignored",
    });

    expect(verifyPayment).not.toHaveBeenCalled();
  });

  it("rejects an invalid webhook signature", async () => {
    const rawBody = JSON.stringify({
      event: "charge.success",
      data: {
        reference: "EVT-e2e-test",
      },
    });

    await request(app.getHttpServer())
      .post("/payments/webhook")
      .set("Content-Type", "application/json")
      .set("x-paystack-signature", "0".repeat(128))
      .send(rawBody)
      .expect(400);

    expect(verifyPayment).not.toHaveBeenCalled();
    expect(issueTicket).not.toHaveBeenCalled();
  });

  it("rejects webhook requests without a signature", async () => {
    await request(app.getHttpServer())
      .post("/payments/webhook")
      .set("Content-Type", "application/json")
      .send(
        JSON.stringify({
          event: "charge.success",
          data: {
            reference: "EVT-e2e-test",
          },
        }),
      )
      .expect(400);

    expect(verifyPayment).not.toHaveBeenCalled();
  });

  it("does not expose direct ticket issuance", async () => {
    await request(app.getHttpServer())
      .post("/tickets/issue/registration_1")
      .expect(404);

    expect(issueTicket).not.toHaveBeenCalled();
  });

  it("does not expose unauthenticated check-in", async () => {
    await request(app.getHttpServer())
      .post("/tickets/checkin")
      .send({
        ticketNumber: "EVT-test-ticket",
      })
      .expect(404);

    expect(checkIn).not.toHaveBeenCalled();
  });
});
