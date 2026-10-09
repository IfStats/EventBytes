
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import * as argon2 from "argon2";

import {
  PrismaClient,
  OrganizationRole,
} from "../src/generated/prisma/client";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV !== "development") {
    throw new Error(
      "Administrative seeding is only allowed in development."
    );
  }

  const connectionString = requiredEnv("DATABASE_URL");
  const adminEmail = requiredEnv("SEED_ADMIN_EMAIL")
    .toLowerCase();
  const adminPassword = requiredEnv("SEED_ADMIN_PASSWORD");
  const organizationId = requiredEnv(
    "SEED_ORGANIZATION_ID"
  );

  const adapter = new PrismaPg({
    connectionString,
  });

  const prisma = new PrismaClient({
    adapter,
  });

  try {
    console.log("Starting EventBytes development seed...");

    const organization =
      await prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
      });

    if (!organization) {
      throw new Error(
        "The configured organization was not found."
      );
    }

    let user = await prisma.user.findUnique({
      where: {
        email: adminEmail,
      },
    });

    if (!user) {
      const passwordHash = await argon2.hash(
        adminPassword
      );

      user = await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          isVerified: true,
          isActive: true,
        },
      });

      console.log("Development admin user created.");
    } else {
      console.log(
        "Existing admin user found. Password unchanged."
      );
    }

    const membership =
      await prisma.membership.upsert({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: organization.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          organizationId: organization.id,
          role: OrganizationRole.OWNER,
        },
      });

    console.log("Development seed completed.", {
      userId: user.id,
      organizationId: organization.id,
      membershipRole: membership.role,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("EventBytes seed failed:", error);
  process.exitCode = 1;
});
