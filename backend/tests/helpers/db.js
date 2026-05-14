import { PrismaClient } from '@prisma/client';

// Ensure we're in test environment
if (env.NODE_ENV !== "test") {
  console.log('==================env.NODE_ENV at db.js==================');
  console.log(env.NODE_ENV);
  console.log('==================env.NODE_ENV at db.js==================');
  throw new Error("Tests must run with NODE_ENV=test");
}

// Use separate test database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
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