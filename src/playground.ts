import { prisma } from "@/server/db";

// Use upsert to create or update the user
const user = await prisma.user.upsert({
  where: {
    emailAddress: "Seth@test.com",
  },
  update: {
    firstName: "Seth",
    lastName: "Test",
  },
  create: {
    emailAddress: "Seth@test.com",
    firstName: "Seth",
    lastName: "Test",
  },
});
console.log("User created/updated:", user);
