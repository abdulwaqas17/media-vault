import { PrismaClient } from "@prisma/client";
import env from "./env.js";

console.log("prisma ===========>",env.DATABASE_URL); 

const prisma = new PrismaClient({
  datasourceUrl: env.DATABASE_URL,
});

export default prisma;
