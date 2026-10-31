import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const main = async () => {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.ADMIN },
    select: { id: true },
  });

  if (existingAdmin) {
    console.log("An Admin account already exists. Skipping bootstrap.");
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME?.trim() || "System Administrator";

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Cannot bootstrap the first Admin: ADMIN_EMAIL and ADMIN_PASSWORD are required.",
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.create({
    data: {
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
      customerId: null,
    },
  });
  console.log(`Initial Admin account (${adminEmail}) successfully created.`);
};

main()
  .catch((error) => {
    console.error("❌ Seed failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
