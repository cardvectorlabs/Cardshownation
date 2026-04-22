-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT;

-- AlterTable
ALTER TABLE "Organizer" ADD COLUMN     "userId" TEXT;

-- CreateTable
CREATE TABLE "OrganizerApproval" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "autoApprove" BOOLEAN NOT NULL DEFAULT false,
    "reviewEvery" INTEGER NOT NULL DEFAULT 4,
    "approvedShowCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizerApproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrganizerApproval_state_city_idx" ON "OrganizerApproval"("state", "city");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizerApproval_organizerId_city_state_key" ON "OrganizerApproval"("organizerId", "city", "state");

-- CreateIndex
CREATE UNIQUE INDEX "Organizer_userId_key" ON "Organizer"("userId");

-- AddForeignKey
ALTER TABLE "Organizer" ADD CONSTRAINT "Organizer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizerApproval" ADD CONSTRAINT "OrganizerApproval_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
