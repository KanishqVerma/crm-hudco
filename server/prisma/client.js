import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.ts";

const url = new URL(process.env.DATABASE_URL);

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  connectionLimit: 5,
  ssl:
    process.env.DB_SSL === "true"
      ? process.env.DB_CA
        ? { ca: process.env.DB_CA.replace(/\\n/g, "\n") }
        : { rejectUnauthorized: false }
      : undefined,
});

const prisma = new PrismaClient({ adapter });
export default prisma;