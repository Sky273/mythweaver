-- AlterTable
ALTER TABLE "PlotThread" ADD COLUMN     "publicDescription" TEXT,
ADD COLUMN     "revealed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Region" ADD COLUMN     "publicDescription" TEXT,
ADD COLUMN     "revealed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "World" ADD COLUMN     "publicDescription" TEXT,
ADD COLUMN     "revealed" BOOLEAN NOT NULL DEFAULT false;
