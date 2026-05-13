import { PrismaClient } from "@prisma/client";
import env from "./env.js";

const prisma = new PrismaClient({
  datasourceUrl: "postgresql://postgres:W@qa$@localhost:5432/media_vault_test",
});

export default prisma;
