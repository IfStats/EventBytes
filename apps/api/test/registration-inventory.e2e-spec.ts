import 'dotenv/config';

import { randomUUID } from 'crypto';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';
import { RegistrationsService } from '../src/registrations/registrations.service';
import { RegistrationLinksService } from '../src/registration-links/registration-links.service';

import type { PrismaService } from '../src/prisma/prisma.service';
import type { PaymentsService } from '../src/payments/payments.service';

function getSafeTestDatabaseUrl(): string {
  const connectionString = process.env.EVENTBYTES_TEST_DATABASE_URL;

  if (!connectionString) {
    throw new Error('EVENTBYTES_TEST_DATABASE_URL is required');
  }

  const url = new URL(connectionString);

  const databaseName = decodeURIComponent(url.pathname.slice(1));

  if (databaseName !== 'eventbytes_payment_test') {
    throw new Error('Refusing to run outside eventbytes_payment_test');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run tests in production mode');
  }

  if (process.env.EVENTBYTES_TEST_CONNECTION_MODE !== 'direct') {
    throw new Error('Set EVENTBYTES_TEST_CONNECTION_MODE=direct');
  }

  const regularUrl = process.env.DATABASE_URL;

  if (regularUrl) {
    const regular = new URL(regularUrl);

    if (
      decodeURIComponent(regular.pathname.slice(1)) === databaseName &&
      regular.hostname.replace('-pooler.', '.') ===
        url.hostname.replace('-pooler.', '.')
    ) {
      throw new Error('Test database must differ from DATABASE_URL');
    }
  }

  // Neon direct connection for transaction testing.
  url.hostname = url.hostname.replace('-pooler.', '.');

  console.log('Inventory test database:', {
    database: databaseName,
    mode: 'direct',
  });

  return url.toString();
}

describe('Registration inventory against isolated PostgreSQL', () => {
  let db: PrismaClient;

  let registrations: RegistrationsService;
  let registrationLinks: RegistrationLinksService;

  let countryCode = '';
  let organizationId = '';
  let eventId = '';
  let linkSlug = '';
  let firstUserId = '';
  let secondUserId = '';

  let categoryId = '';

  beforeAll(async () => {
    const connectionString = getSafeTestDatabaseUrl();

    db = new PrismaClient({
      adapter: new PrismaPg({
        connectionString,
        max: 4,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 10000,
      }),
    });

    await db.$connect();

    const suffix = randomUUID().replace(/-/g, '');

    countryCode = `IT${suffix.slice(0, 12)}`;

    await db.country.create({
      data: {
        code: countryCode,
        name: 'Inventory integration test',
        currency: 'GHS',
        symbol: 'GHS',
        locale: 'en-GH',
        timezone: 'Africa/Accra',
      },
    });

    const firstUser = await db.user.create({
      data: {
        email: `inventory-a-${suffix}@example.invalid`,
        passwordHash: 'test-only',
      },
    });

    firstUserId = firstUser.id;

    const secondUser = await db.user.create({
      data: {
        email: `inventory-b-${suffix}@example.invalid`,
        passwordHash: 'test-only',
      },
    });

    secondUserId = secondUser.id;

    const organization = await db.organization.create({
      data: {
        name: 'Inventory integration tests',
        slug: `inventory-org-${suffix}`,
        countryCode,
      },
    });

    organizationId = organization.id;

    const event = await db.event.create({
      data: {
        organizationId,
        name: 'Inventory test event',
        slug: `inventory-event-${suffix}`,
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 172800000),
      },
    });

    eventId = event.id;

    linkSlug = `inventory-link-${suffix}`;

    await db.registrationLink.create({
      data: {
        eventId,
        slug: linkSlug,
        active: true,
      },
    });

    registrations = new RegistrationsService(db as unknown as PrismaService);

    registrationLinks = new RegistrationLinksService(
      db as unknown as PrismaService,
      {} as PaymentsService,
    );
  }, 60000);

  beforeEach(async () => {
    const category = await db.ticketCategory.create({
      data: {
        eventId,
        name: `General-${randomUUID()}`,
        price: 50,
        quantity: 1,
        sold: 0,
      },
    });

    categoryId = category.id;
  });

  afterEach(async () => {
    if (!categoryId) return;

    await db.registration.deleteMany({
      where: {
        ticketCategoryId: categoryId,
      },
    });

    await db.ticketCategory.deleteMany({
      where: {
        id: categoryId,
      },
    });

    categoryId = '';
  });

  afterAll(async () => {
    if (!db) return;

    try {
      if (linkSlug) {
        await db.registrationLink.deleteMany({
          where: {
            slug: linkSlug,
          },
        });
      }

      if (eventId) {
        await db.event.deleteMany({
          where: {
            id: eventId,
          },
        });
      }

      if (organizationId) {
        await db.organization.deleteMany({
          where: {
            id: organizationId,
          },
        });
      }

      if (firstUserId || secondUserId) {
        await db.user.deleteMany({
          where: {
            id: {
              in: [firstUserId, secondUserId].filter(Boolean),
            },
          },
        });
      }

      if (countryCode) {
        await db.country.deleteMany({
          where: {
            code: countryCode,
          },
        });
      }
    } finally {
      await db.$disconnect();
    }
  }, 60000);

  it('prevents overselling the last ticket across both registration paths', async () => {
    const outcomes = await Promise.allSettled([
      registrations.create(firstUserId, {
        eventId,
        ticketTypeId: categoryId,
      }),

      registrationLinks.registerFromLink(linkSlug, secondUserId, categoryId),
    ]);

    const successful = outcomes.filter(
      (result) => result.status === 'fulfilled',
    );

    const rejected = outcomes.filter((result) => result.status === 'rejected');

    expect(successful).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const category = await db.ticketCategory.findUniqueOrThrow({
      where: {
        id: categoryId,
      },
    });

    const savedRegistrations = await db.registration.findMany({
      where: {
        ticketCategoryId: categoryId,
      },
    });

    expect(category.quantity).toBe(1);
    expect(category.sold).toBe(1);
    expect(savedRegistrations).toHaveLength(1);
  });

  it('prevents duplicate active registrations across both paths', async () => {
    await db.ticketCategory.update({
      where: {
        id: categoryId,
      },
      data: {
        quantity: 2,
      },
    });

    const outcomes = await Promise.allSettled([
      registrations.create(firstUserId, {
        eventId,
        ticketTypeId: categoryId,
      }),

      registrationLinks.registerFromLink(linkSlug, firstUserId, categoryId),
    ]);

    expect(
      outcomes.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);

    expect(
      outcomes.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);

    const category = await db.ticketCategory.findUniqueOrThrow({
      where: {
        id: categoryId,
      },
    });

    const savedRegistrations = await db.registration.findMany({
      where: {
        ticketCategoryId: categoryId,
        userId: firstUserId,
      },
    });

    expect(category.sold).toBe(1);
    expect(savedRegistrations).toHaveLength(1);
  });

  it('rolls back inventory when registration creation fails', async () => {
    const invalidUserId = `missing-${randomUUID()}`;

    await expect(
      registrations.create(invalidUserId, {
        eventId,
        ticketTypeId: categoryId,
      }),
    ).rejects.toThrow();

    const category = await db.ticketCategory.findUniqueOrThrow({
      where: {
        id: categoryId,
      },
    });

    const count = await db.registration.count({
      where: {
        ticketCategoryId: categoryId,
      },
    });

    expect(category.sold).toBe(0);
    expect(count).toBe(0);
  });
});
