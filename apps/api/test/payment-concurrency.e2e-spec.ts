import "dotenv/config";
import { randomUUID } from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PaymentProvider,
  PaymentStatus,
  PrismaClient,
  RegistrationStatus,
} from "../src/generated/prisma/client";
import { PaymentsService } from "../src/payments/payments.service";
import type { PrismaService } from "../src/prisma/prisma.service";
import type { TicketsService } from "../src/tickets/tickets.service";
import type { MailService } from "../src/mail/mail.service";
import type { ConfigService } from "@nestjs/config";
import type { HttpService } from "@nestjs/axios";

function requireIsolatedTestDatabase(): string {
  const connectionString = process.env.EVENTBYTES_TEST_DATABASE_URL;
  if (!connectionString) {
    throw new Error("Set EVENTBYTES_TEST_DATABASE_URL to an isolated PostgreSQL test database.");
  }

  const test = new URL(connectionString);
  const databaseName = decodeURIComponent(test.pathname.slice(1));
  if (!databaseName.toLowerCase().includes("test")) {
    throw new Error("Refusing to run: database name must include 'test'.");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run payment integration tests in production.");
  }
  if (process.env.DATABASE_URL) {
    const regular = new URL(process.env.DATABASE_URL);
    if (
      test.toString() === regular.toString() ||
      (test.hostname.replace("-pooler", "") === regular.hostname.replace("-pooler", "") &&
        test.port === regular.port &&
        test.pathname === regular.pathname)
    ) {
      throw new Error("Test database must not be the application's regular DATABASE_URL.");
    }
  }
  return connectionString;
}

describe("Payment fulfillment against isolated PostgreSQL", () => {
  let db: PrismaClient;
  let service: PaymentsService;
  let userId = "";
  let countryCode = "";
  let organizationId = "";
  let eventId = "";
  let categoryId = "";
  let registrationId = "";
  let reference = "";

  let sendTicket: jest.Mock;

  beforeAll(async () => {
    

const connectionString = requireIsolatedTestDatabase();

const mode =
  process.env.EVENTBYTES_TEST_CONNECTION_MODE ?? "pooled";

if (mode !== "pooled" && mode !== "direct") {
  throw new Error("Invalid test connection mode");
}

const url = new URL(connectionString);

if (mode === "direct") {
  url.hostname = url.hostname.replace(
    "-pooler.",
    ".",
  );
}

console.log("PostgreSQL test connection:", {
  mode,
  host: url.hostname,
  database: decodeURIComponent(url.pathname.slice(1)),
});


db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: url.toString(),
    max: 4,
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 10_000,
  }),
});


await db.$connect();



    const suffix = randomUUID().replace(/-/g, "");
    countryCode = `TEST${suffix.slice(0, 12)}`;

    await db.country.create({
      data: {
        code: countryCode,
        name: "Automated payment test",
        currency: "GHS",
        symbol: "GH₵",
        locale: "en-GH",
        timezone: "Africa/Accra",
        paymentProvider: PaymentProvider.PAYSTACK,
      },
    });

    const user = await db.user.create({
      data: {
        email: `eventbytes-${suffix}@example.invalid`,
        passwordHash: "integration-test-only-not-a-real-login",
      },
    });
    userId = user.id;

    const organization = await db.organization.create({
      data: {
        name: "Payment integration tests",
        slug: `payment-test-${suffix}`,
        countryCode,
      },
    });
    organizationId = organization.id;

    const event = await db.event.create({
      data: {
        organizationId,
        name: "Integration test event",
        slug: `payment-test-event-${suffix}`,
        startDate: new Date(Date.now() + 86_400_000),
        endDate: new Date(Date.now() + 172_800_000),
      },
    });
    eventId = event.id;

    const category = await db.ticketCategory.create({
      data: {
        eventId,
        name: "General",
        price: 50,
        quantity: 100,
      },
    });
    categoryId = category.id;
  });

  beforeEach(async () => {
    const registration = await db.registration.create({
      data: {
        userId,
        eventId,
        ticketCategoryId: categoryId,
        status: RegistrationStatus.PENDING_PAYMENT,
      },
    });
    registrationId = registration.id;
    reference = `EVT-${randomUUID()}`;

    await db.payment.create({
      data: {
        registrationId,
        amount: 50,
        currency: "GHS",
        provider: PaymentProvider.PAYSTACK,
        reference,
        status: PaymentStatus.PENDING,
      },
    });

    sendTicket = jest.fn().mockResolvedValue({
      data: { id: "test-email-not-sent" },
      error: null,
    });

    const http = {
      axiosRef: {
        get: jest.fn(async (url: string) => {
          const requestedReference = decodeURIComponent(url.split("/").pop() || "");
          return {
            data: {
              status: true,
              data: {
                status: "success",
                reference: requestedReference,
                currency: "GHS",
                amount: 5000,
              },
            },
          };
        }),
      },
    };

    const config = {
      get: (key: string) =>
        key === "PAYSTACK_SECRET_KEY" ? "test-secret-no-real-provider-requests" : undefined,
    };

    service = new PaymentsService(
      db as unknown as PrismaService,
      {} as TicketsService,
      { sendTicket } as unknown as MailService,
      http as unknown as HttpService,
      config as unknown as ConfigService,
    );
  });

  afterEach(async () => {
    if (!db || !registrationId) return;
    await db.ticket.deleteMany({ where: { registrationId } });
    await db.payment.deleteMany({ where: { registrationId } });
    await db.registration.deleteMany({ where: { id: registrationId } });
    registrationId = "";
  });

  afterAll(async () => {
    if (!db) return;
    try {
      if (categoryId) await db.ticketCategory.deleteMany({ where: { id: categoryId } });
      if (eventId) await db.event.deleteMany({ where: { id: eventId } });
      if (organizationId) await db.organization.deleteMany({ where: { id: organizationId } });
      if (userId) await db.user.deleteMany({ where: { id: userId } });
      if (countryCode) await db.country.deleteMany({ where: { code: countryCode } });
    } finally {
      await db.$disconnect();
    }
  });

  it("fulfills four simultaneous callbacks exactly once", async () => {
    
const outcomes = await Promise.allSettled(
  Array.from({ length: 4 }, () =>
    service.verify(reference, userId),
  ),
);

const failures = outcomes.flatMap((outcome) =>
  outcome.status === "rejected"
    ? [
        outcome.reason instanceof Error
          ? outcome.reason.message
          : String(outcome.reason),
      ]
    : [],
);

expect(failures).toEqual([]);

const results = outcomes.flatMap((outcome) =>
  outcome.status === "fulfilled"
    ? [outcome.value]
    : [],
);


    expect(results.filter((result) => result.message === "Payment verified")).toHaveLength(1);
    expect(results.filter((result) => result.message === "Payment already processed")).toHaveLength(3);

    const [payment, registration, tickets] = await Promise.all([
      db.payment.findUniqueOrThrow({ where: { reference } }),
      db.registration.findUniqueOrThrow({ where: { id: registrationId } }),
      db.ticket.findMany({ where: { registrationId } }),
    ]);

    expect(payment.status).toBe(PaymentStatus.PAID);
    expect(registration.status).toBe(RegistrationStatus.CONFIRMED);
    expect(tickets).toHaveLength(1);
    expect(sendTicket).toHaveBeenCalledTimes(1);
  });

  it("rolls back payment and registration updates if ticket creation fails", async () => {
    await db.ticket.create({
      data: {
        registrationId,
        ticketNumber: `EVT-EXISTING-${randomUUID()}`,
        qrToken: randomUUID(),
      },
    });

    await expect(service.verify(reference, userId)).rejects.toThrow();

    const [payment, registration, tickets] = await Promise.all([
      db.payment.findUniqueOrThrow({ where: { reference } }),
      db.registration.findUniqueOrThrow({ where: { id: registrationId } }),
      db.ticket.findMany({ where: { registrationId } }),
    ]);

    expect(payment.status).toBe(PaymentStatus.PENDING);
    expect(registration.status).toBe(RegistrationStatus.PENDING_PAYMENT);
    expect(tickets).toHaveLength(1);
    expect(sendTicket).not.toHaveBeenCalled();
  });

  it("rolls back the second competing successful charge", async () => {
    const otherReference = `EVT-${randomUUID()}`;
    await db.payment.create({
      data: {
        registrationId,
        amount: 50,
        currency: "GHS",
        provider: PaymentProvider.PAYSTACK,
        reference: otherReference,
        status: PaymentStatus.PENDING,
      },
    });

    const outcomes = await Promise.allSettled([
      service.verify(reference, userId),
      service.verify(otherReference, userId),
    ]);

    expect(outcomes.filter((x) => x.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((x) => x.status === "rejected")).toHaveLength(1);

    const [payments, tickets, registration] = await Promise.all([
      db.payment.findMany({ where: { registrationId } }),
      db.ticket.findMany({ where: { registrationId } }),
      db.registration.findUniqueOrThrow({ where: { id: registrationId } }),
    ]);

    expect(payments.filter((p) => p.status === PaymentStatus.PAID)).toHaveLength(1);
    expect(payments.filter((p) => p.status === PaymentStatus.PENDING)).toHaveLength(1);
    expect(registration.status).toBe(RegistrationStatus.CONFIRMED);
    expect(tickets).toHaveLength(1);
    expect(sendTicket).toHaveBeenCalledTimes(1);
  });
});
