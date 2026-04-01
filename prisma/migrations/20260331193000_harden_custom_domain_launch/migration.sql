ALTER TABLE "PublicPageSettings"
ADD COLUMN "customDomainDnsStatus" TEXT NOT NULL DEFAULT 'not_started',
ADD COLUMN "customDomainDiagnostics" JSONB;
