-- CreateTable
CREATE TABLE "ProductAnalyticsEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "event" TEXT NOT NULL,
    "path" TEXT,
    "source" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductAnalyticsEvent_event_createdAt_idx"
ON "ProductAnalyticsEvent"("event", "createdAt");

-- CreateIndex
CREATE INDEX "ProductAnalyticsEvent_userId_createdAt_idx"
ON "ProductAnalyticsEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ProductAnalyticsEvent_sessionId_createdAt_idx"
ON "ProductAnalyticsEvent"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProductAnalyticsEvent"
ADD CONSTRAINT "ProductAnalyticsEvent_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
