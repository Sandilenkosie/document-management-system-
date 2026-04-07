import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = "Password@123";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const seedUsers: Array<{
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }> = [
    {
      email: "user@pcg-mindrift.local",
      firstName: "Standard",
      lastName: "User",
      role: "USER",
    },
    {
      email: "reviewer@pcg-mindrift.local",
      firstName: "Document",
      lastName: "Reviewer",
      role: "REVIEWER",
    },
    {
      email: "manager@pcg-mindrift.local",
      firstName: "Approval",
      lastName: "Manager",
      role: "MANAGER",
    },
    {
      email: "admin@pcg-mindrift.local",
      firstName: "System",
      lastName: "Admin",
      role: "ADMIN",
    },
  ];

  for (const user of seedUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: true,
      },
      create: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        password: passwordHash,
        isActive: true,
      },
    });
  }

  console.log("Seed complete. Users available:");
  for (const user of seedUsers) {
    console.log(`- ${user.role}: ${user.email}`);
  }
  console.log(`Default password: ${defaultPassword}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
