-- AlterTable
ALTER TABLE "User" ALTER COLUMN "salt" DROP NOT NULL,
ALTER COLUMN "sessionToken" DROP NOT NULL;
