import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@eventbytes.com';
  const passwordHash = await argon2.hash('Password123!');

  await prisma.user.upsert({
    where: {
      email,
    },
    update: {
      passwordHash,
      firstName: 'Joshua',
      lastName: 'Akunna',
    },
    create: {
      email,
      passwordHash,
      firstName: 'Joshua',
      lastName: 'Akunna',
      isVerified: true,
      isActive: true,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });