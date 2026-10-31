import { PrismaClient } from "@prisma/client";

// Run with `npm run db:seed`. Demo data is not defined yet; add idempotent upserts here.
const prisma = new PrismaClient();

const main = async () => {
  console.log("No seed data defined yet.");
};

main()
  .catch((error) => {
    console.error("Seed failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
