import { PrismaClient } from "@/generated/prisma/client";
import { env } from "process";

const createPrismaClient = () => new PrismaClient({
    log:  env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : [],
    
});
const globalForPrisma = global as unknown as { prisma: ReturnType<typeof createPrismaClient> | undefined};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;