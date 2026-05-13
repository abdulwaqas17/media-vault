import { PrismaClient } from '@prisma/client';

// Use separate test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL
    }
  }
});

// Clean database before each test
export const cleanDatabase = async () => {
  await prisma.sessions.deleteMany();
  await prisma.media_assets.deleteMany();
  await prisma.profiles.deleteMany();
  await prisma.users.deleteMany();
};

export default prisma;