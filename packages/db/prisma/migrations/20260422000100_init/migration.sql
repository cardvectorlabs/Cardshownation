-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FAN', 'ORGANIZER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ShowStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('MANUAL', 'SUBMITTED', 'IMPORTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'FAN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organizer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "websiteUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organizer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address1" TEXT NOT NULL,
    "address2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "parkingInfo" TEXT,
    "loadInInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Show" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" "ShowStatus" NOT NULL DEFAULT 'PENDING',
    "sourceType" "SourceType" NOT NULL DEFAULT 'SUBMITTED',
    "timezone" TEXT NOT NULL DEFAULT 'America/Chicago',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startTimeLabel" TEXT,
    "endTimeLabel" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "admissionPrice" TEXT,
    "admissionNotes" TEXT,
    "tableCount" INTEGER,
    "vendorDetails" TEXT,
    "estimatedAttendance" INTEGER,
    "flyerImageUrl" TEXT,
    "websiteUrl" TEXT,
    "facebookUrl" TEXT,
    "ticketUrl" TEXT,
    "parkingInfo" TEXT,
    "loadInInfo" TEXT,
    "venueNotes" TEXT,
    "categories" TEXT[],
    "lastVerifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "featuredRank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizerId" TEXT,
    "venueId" TEXT,

    CONSTRAINT "Show_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedShow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedShow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowSubmission" (
    "id" TEXT NOT NULL,
    "submitterName" TEXT NOT NULL,
    "submitterEmail" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "reviewedShowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShowSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowReport" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "userId" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShowReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShowTag" (
    "id" TEXT NOT NULL,
    "showId" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "ShowTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportLog" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "imported" INTEGER NOT NULL,
    "skipped" INTEGER NOT NULL,
    "errors" INTEGER NOT NULL,
    "errorDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "State" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "seoBlurb" TEXT,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Venue_state_idx" ON "Venue"("state");

-- CreateIndex
CREATE INDEX "Venue_city_state_idx" ON "Venue"("city", "state");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_name_city_state_key" ON "Venue"("name", "city", "state");

-- CreateIndex
CREATE UNIQUE INDEX "Show_slug_key" ON "Show"("slug");

-- CreateIndex
CREATE INDEX "Show_state_status_startDate_idx" ON "Show"("state", "status", "startDate");

-- CreateIndex
CREATE INDEX "Show_city_state_status_idx" ON "Show"("city", "state", "status");

-- CreateIndex
CREATE INDEX "Show_slug_idx" ON "Show"("slug");

-- CreateIndex
CREATE INDEX "Show_startDate_status_idx" ON "Show"("startDate", "status");

-- CreateIndex
CREATE INDEX "Show_status_featuredRank_idx" ON "Show"("status", "featuredRank");

-- CreateIndex
CREATE UNIQUE INDEX "SavedShow_userId_showId_key" ON "SavedShow"("userId", "showId");

-- CreateIndex
CREATE INDEX "ShowTag_label_idx" ON "ShowTag"("label");

-- CreateIndex
CREATE UNIQUE INDEX "ShowTag_showId_label_key" ON "ShowTag"("showId", "label");

-- CreateIndex
CREATE INDEX "ImportLog_source_createdAt_idx" ON "ImportLog"("source", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "State_slug_key" ON "State"("slug");

-- AddForeignKey
ALTER TABLE "Show" ADD CONSTRAINT "Show_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Show" ADD CONSTRAINT "Show_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedShow" ADD CONSTRAINT "SavedShow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedShow" ADD CONSTRAINT "SavedShow_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowReport" ADD CONSTRAINT "ShowReport_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowReport" ADD CONSTRAINT "ShowReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShowTag" ADD CONSTRAINT "ShowTag_showId_fkey" FOREIGN KEY ("showId") REFERENCES "Show"("id") ON DELETE CASCADE ON UPDATE CASCADE;
