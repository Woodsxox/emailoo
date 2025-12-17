import { defineConfig } from "prisma/config";

// Use process.env directly - prisma generate doesn't need a real connection
// This prevents errors during build when DATABASE_URL might not be available
const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://user:password@localhost:5432/dbname";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: databaseUrl,
  },
});
