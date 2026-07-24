import { PrismaClient } from "@/generated/prisma";

// Un singleton pour éviter d'épuiser le pool de connexions en dev
// (le hot-reload de Next.js réinstancie sinon le client à chaque changement).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
