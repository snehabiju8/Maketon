import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const main = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@brightloop.com").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "AdminPassword123!";
  const adminName = process.env.ADMIN_NAME || "System Administrator";

  console.log(`Bootstrapping initial Admin account for: ${adminEmail}`);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
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
    console.log(`✅ Initial Admin account (${adminEmail}) successfully created.`);
  } else {
    console.log(`ℹ️ Admin account (${adminEmail}) already exists. Skipping creation.`);
  }
};

main()
  .catch((error) => {
    console.error("❌ Seed failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
