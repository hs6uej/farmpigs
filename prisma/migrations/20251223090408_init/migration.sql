-- CreateEnum
CREATE TYPE "SowStatus" AS ENUM ('ACTIVE', 'PREGNANT', 'LACTATING', 'WEANED', 'CULLED', 'SOLD', 'DEAD');

-- CreateEnum
CREATE TYPE "BoarStatus" AS ENUM ('ACTIVE', 'RETIRED', 'SOLD', 'DEAD');

-- CreateEnum
CREATE TYPE "BreedingMethod" AS ENUM ('NATURAL', 'AI');

-- CreateEnum
CREATE TYPE "PigletStatus" AS ENUM ('NURSING', 'WEANED', 'GROWING', 'READY', 'SOLD', 'DEAD');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "PenType" AS ENUM ('FARROWING', 'NURSERY', 'GROWING', 'FINISHING');

-- CreateEnum
CREATE TYPE "HealthRecordType" AS ENUM ('VACCINATION', 'TREATMENT', 'DISEASE', 'MORTALITY');

-- CreateTable
CREATE TABLE "Sow" (
    "id" TEXT NOT NULL,
    "tagNumber" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "status" "SowStatus" NOT NULL DEFAULT 'ACTIVE',
    "purchaseDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Boar" (
    "id" TEXT NOT NULL,
    "tagNumber" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "status" "BoarStatus" NOT NULL DEFAULT 'ACTIVE',
    "purchaseDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Boar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Breeding" (
    "id" TEXT NOT NULL,
    "sowId" TEXT NOT NULL,
    "boarId" TEXT NOT NULL,
    "breedingDate" TIMESTAMP(3) NOT NULL,
    "breedingMethod" "BreedingMethod" NOT NULL,
    "expectedFarrowDate" TIMESTAMP(3),
    "success" BOOLEAN,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Breeding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farrowing" (
    "id" TEXT NOT NULL,
    "sowId" TEXT NOT NULL,
    "breedingId" TEXT NOT NULL,
    "farrowingDate" TIMESTAMP(3) NOT NULL,
    "totalBorn" INTEGER NOT NULL,
    "bornAlive" INTEGER NOT NULL,
    "stillborn" INTEGER NOT NULL DEFAULT 0,
    "mummified" INTEGER NOT NULL DEFAULT 0,
    "averageBirthWeight" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farrowing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Piglet" (
    "id" TEXT NOT NULL,
    "tagNumber" TEXT,
    "farrowingId" TEXT NOT NULL,
    "birthWeight" DOUBLE PRECISION,
    "currentPenId" TEXT,
    "status" "PigletStatus" NOT NULL DEFAULT 'NURSING',
    "gender" "Gender",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Piglet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pen" (
    "id" TEXT NOT NULL,
    "penNumber" TEXT NOT NULL,
    "penType" "PenType" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Weaning" (
    "id" TEXT NOT NULL,
    "pigletId" TEXT NOT NULL,
    "weaningDate" TIMESTAMP(3) NOT NULL,
    "weaningWeight" DOUBLE PRECISION NOT NULL,
    "ageAtWeaning" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Weaning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PenTransfer" (
    "id" TEXT NOT NULL,
    "pigletId" TEXT NOT NULL,
    "fromPenId" TEXT,
    "toPenId" TEXT NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PenTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GrowthRecord" (
    "id" TEXT NOT NULL,
    "pigletId" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "ageInDays" INTEGER NOT NULL,
    "adg" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GrowthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthRecord" (
    "id" TEXT NOT NULL,
    "recordType" "HealthRecordType" NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "sowId" TEXT,
    "boarId" TEXT,
    "pigletId" TEXT,
    "vaccineName" TEXT,
    "medicineName" TEXT,
    "dosage" TEXT,
    "administeredBy" TEXT,
    "disease" TEXT,
    "symptoms" TEXT,
    "treatment" TEXT,
    "outcome" TEXT,
    "deathCause" TEXT,
    "cost" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedConsumption" (
    "id" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "penId" TEXT,
    "feedType" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sow_tagNumber_key" ON "Sow"("tagNumber");

-- CreateIndex
CREATE INDEX "Sow_tagNumber_idx" ON "Sow"("tagNumber");

-- CreateIndex
CREATE INDEX "Sow_status_idx" ON "Sow"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Boar_tagNumber_key" ON "Boar"("tagNumber");

-- CreateIndex
CREATE INDEX "Boar_tagNumber_idx" ON "Boar"("tagNumber");

-- CreateIndex
CREATE INDEX "Boar_status_idx" ON "Boar"("status");

-- CreateIndex
CREATE INDEX "Breeding_sowId_idx" ON "Breeding"("sowId");

-- CreateIndex
CREATE INDEX "Breeding_boarId_idx" ON "Breeding"("boarId");

-- CreateIndex
CREATE INDEX "Breeding_breedingDate_idx" ON "Breeding"("breedingDate");

-- CreateIndex
CREATE UNIQUE INDEX "Farrowing_breedingId_key" ON "Farrowing"("breedingId");

-- CreateIndex
CREATE INDEX "Farrowing_sowId_idx" ON "Farrowing"("sowId");

-- CreateIndex
CREATE INDEX "Farrowing_farrowingDate_idx" ON "Farrowing"("farrowingDate");

-- CreateIndex
CREATE UNIQUE INDEX "Piglet_tagNumber_key" ON "Piglet"("tagNumber");

-- CreateIndex
CREATE INDEX "Piglet_farrowingId_idx" ON "Piglet"("farrowingId");

-- CreateIndex
CREATE INDEX "Piglet_currentPenId_idx" ON "Piglet"("currentPenId");

-- CreateIndex
CREATE INDEX "Piglet_status_idx" ON "Piglet"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Pen_penNumber_key" ON "Pen"("penNumber");

-- CreateIndex
CREATE INDEX "Pen_penNumber_idx" ON "Pen"("penNumber");

-- CreateIndex
CREATE INDEX "Pen_penType_idx" ON "Pen"("penType");

-- CreateIndex
CREATE UNIQUE INDEX "Weaning_pigletId_key" ON "Weaning"("pigletId");

-- CreateIndex
CREATE INDEX "Weaning_weaningDate_idx" ON "Weaning"("weaningDate");

-- CreateIndex
CREATE INDEX "PenTransfer_pigletId_idx" ON "PenTransfer"("pigletId");

-- CreateIndex
CREATE INDEX "PenTransfer_transferDate_idx" ON "PenTransfer"("transferDate");

-- CreateIndex
CREATE INDEX "GrowthRecord_pigletId_idx" ON "GrowthRecord"("pigletId");

-- CreateIndex
CREATE INDEX "GrowthRecord_recordDate_idx" ON "GrowthRecord"("recordDate");

-- CreateIndex
CREATE INDEX "HealthRecord_recordType_idx" ON "HealthRecord"("recordType");

-- CreateIndex
CREATE INDEX "HealthRecord_recordDate_idx" ON "HealthRecord"("recordDate");

-- CreateIndex
CREATE INDEX "HealthRecord_sowId_idx" ON "HealthRecord"("sowId");

-- CreateIndex
CREATE INDEX "HealthRecord_boarId_idx" ON "HealthRecord"("boarId");

-- CreateIndex
CREATE INDEX "HealthRecord_pigletId_idx" ON "HealthRecord"("pigletId");

-- CreateIndex
CREATE INDEX "FeedConsumption_recordDate_idx" ON "FeedConsumption"("recordDate");

-- CreateIndex
CREATE INDEX "FeedConsumption_penId_idx" ON "FeedConsumption"("penId");

-- AddForeignKey
ALTER TABLE "Breeding" ADD CONSTRAINT "Breeding_sowId_fkey" FOREIGN KEY ("sowId") REFERENCES "Sow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breeding" ADD CONSTRAINT "Breeding_boarId_fkey" FOREIGN KEY ("boarId") REFERENCES "Boar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farrowing" ADD CONSTRAINT "Farrowing_sowId_fkey" FOREIGN KEY ("sowId") REFERENCES "Sow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farrowing" ADD CONSTRAINT "Farrowing_breedingId_fkey" FOREIGN KEY ("breedingId") REFERENCES "Breeding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Piglet" ADD CONSTRAINT "Piglet_farrowingId_fkey" FOREIGN KEY ("farrowingId") REFERENCES "Farrowing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Piglet" ADD CONSTRAINT "Piglet_currentPenId_fkey" FOREIGN KEY ("currentPenId") REFERENCES "Pen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Weaning" ADD CONSTRAINT "Weaning_pigletId_fkey" FOREIGN KEY ("pigletId") REFERENCES "Piglet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenTransfer" ADD CONSTRAINT "PenTransfer_pigletId_fkey" FOREIGN KEY ("pigletId") REFERENCES "Piglet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PenTransfer" ADD CONSTRAINT "PenTransfer_toPenId_fkey" FOREIGN KEY ("toPenId") REFERENCES "Pen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrowthRecord" ADD CONSTRAINT "GrowthRecord_pigletId_fkey" FOREIGN KEY ("pigletId") REFERENCES "Piglet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_sowId_fkey" FOREIGN KEY ("sowId") REFERENCES "Sow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_boarId_fkey" FOREIGN KEY ("boarId") REFERENCES "Boar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_pigletId_fkey" FOREIGN KEY ("pigletId") REFERENCES "Piglet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
