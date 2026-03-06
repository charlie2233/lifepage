ALTER TABLE "PublicPageSettings"
ADD COLUMN "resumeModel" TEXT NOT NULL DEFAULT 'executive',
ADD COLUMN "resumeModelConfig" JSONB;
