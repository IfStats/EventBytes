import { PrismaClient, OrganizationRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Organization
  const organization = await prisma.organization.create({
    data: {
      name: 'EventBytes',
      slug: 'eventbytes',
      description: 'Default organization',
    },
  });

  // Admin User
  const user = await prisma.user.create({
    data: {
      email: 'admin@eventbytes.com',
      passwordHash: 'CHANGE_ME_LATER',
      firstName: 'System',
      lastName: 'Administrator',
      isVerified: true,
    },
  });

  // Membership
  await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId: organization.id,
      role: OrganizationRole.OWNER,
    },
  });

  // Sample Event
  const event = await prisma.event.create({
    data: {
      organizationId: organization.id,
      name: 'EventBytes Launch Conference',
      slug: 'eventbytes-launch',
      description: 'Seed Event',
      venue: 'Accra International Conference Centre',
      startDate: new Date('2026-12-01T09:00:00Z'),
      endDate: new Date('2026-12-01T18:00:00Z'),
      capacity: 500,
    },
  });

  // Ticket Categories
  await prisma.ticketCategory.createMany({
    data: [
      {
        eventId: event.id,
        name: 'Early Bird',
        price: 100,
        quantity: 100,
      },
      {
        eventId: event.id,
        name: 'Regular',
        price: 200,
        quantity: 300,
      },
      {
        eventId: event.id,
        name: 'VIP',
        price: 500,
        quantity: 100,
      },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
