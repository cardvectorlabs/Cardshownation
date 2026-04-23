ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MODERATOR';

ALTER TABLE "ShowSubmission"
ADD COLUMN "reviewerId" TEXT,
ADD COLUMN "reviewerRole" "UserRole";

ALTER TABLE "ShowSubmission"
ADD CONSTRAINT "ShowSubmission_reviewerId_fkey"
FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
