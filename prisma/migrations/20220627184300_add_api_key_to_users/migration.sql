-- AlterTable
ALTER TABLE "users" ADD COLUMN "api_key" UUID NOT NULL DEFAULT gen_random_uuid();

-- CreateIndex
CREATE UNIQUE INDEX "users_api_key" ON "users"("api_key");
