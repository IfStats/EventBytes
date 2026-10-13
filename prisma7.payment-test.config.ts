import "dotenv/config";
import { defineConfig } from "@prisma/prisma7/config";

const connectionString = process.env.EVENTBYTES_TEST_DATABASE_URL;

if (!connectionString) {
  throw new Error("EVENTBYTES_TEST_DATABASE_URL must be set.");
}

const url = new URL(connectionString);
const databaseName = decodeURIComponent(url.pathname.slice(1));

if (!databaseName.toLowerCase().includes("test")) {
  throw new Error("Refusing migration: test database name must contain 'test'.");
}

if (process.env.DATABASE_URL === connectionString) {
  throw new Error("Test database URL must differ from DATABASE_URL.");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: connectionString },
});
