import { PrismaClient, OrganizationRole } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  // Create or update admin user
  const passwordHash = await argon2.hash("Password123!");

  const user = await prisma.user.upsert({
    where: {
      email: "admin@eventbytes.com",
    },
    update: {
      passwordHash,
      firstName: "Joshua",
      lastName: "Akunna",
      isVerified: true,
      isActive: true,
    },
    create: {
      email: "admin@eventbytes.com",
      passwordHash,
      firstName: "Joshua",
      lastName: "Akunna",
      isVerified: true,
      isActive: true,
    },
  });

  // Use your existing organization
  const organization =
    await prisma.organization.findUnique({
      where: {
        id: "cms96mvtb0000w2jcsy2k872r",
      },
    });

  if (!organization) {
    throw new Error(
      "Organization cms96mvtb0000w2jcsy2k872r not found."
    );
  }

  // Create membership if missing
  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id,
      },
    },
    update: {
      role: OrganizationRole.OWNER,
    },
    create: {
      userId: user.id,
      organizationId: organization.id,
      role: OrganizationRole.OWNER,
    },
  });

  console.log("✅ Admin user linked to organization.");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });