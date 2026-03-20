ALTER TABLE "images" ADD COLUMN "sha256_hash" text;
CREATE UNIQUE INDEX "images_sha256_hash_unique" ON "images" USING btree ("sha256_hash") WHERE "sha256_hash" IS NOT NULL;
