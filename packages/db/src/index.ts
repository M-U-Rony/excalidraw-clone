import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { config as loadEnv } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));

loadEnv({
  path: resolve(currentDir, "../../.env"),
  override: false,
});

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined. Check packages/db/.env and runtime env loading.");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prismaClient = new PrismaClient({ adapter });
