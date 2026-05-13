# Initialize
npx prisma init

# Create migration
npx prisma migrate dev --name init

# Generate client
npx prisma generate

# Open GUI
npx prisma studio

# Reset database
npx prisma migrate reset

# Production migrations
npx prisma migrate deploy

# Pull existing schema
npx prisma db pull

# Push schema without migration
npx prisma db push

# Prima seed command
npx prisma db seed

# Useful npm Scripts
{
  "scripts": {
    "prisma:init": "prisma init",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "prisma:reset": "prisma migrate reset",
    "prisma:studio": "prisma studio",
    "prisma:pull": "prisma db pull",
    "prisma:push": "prisma db push",
    "prisma:seed": "prisma db seed",
    "prisma:status": "prisma migrate status",
    "prisma:validate": "prisma validate",
    "prisma:format": "prisma format"
  }
}





## PostgreSQL Commands

# PostgreSQL mein login
psql -U postgres

# Agar password hai to:
# psql -U postgres -W

# Database create karo
CREATE DATABASE media_vault_test;

# Check karo
\l

# Exit
\q