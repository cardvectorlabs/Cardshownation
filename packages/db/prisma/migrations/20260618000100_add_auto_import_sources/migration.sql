CREATE TABLE "AutoImportSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "organizerName" TEXT,
    "categories" TEXT[],
    "facebookUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoImportSource_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AutoImportSource_url_key" ON "AutoImportSource"("url");
CREATE INDEX "AutoImportSource_active_createdAt_idx" ON "AutoImportSource"("active", "createdAt");
