ALTER TABLE "recipes" ADD COLUMN "recipe_fingerprint" text;--> statement-breakpoint
CREATE INDEX "recipes_recipe_fingerprint_idx" ON "recipes" USING btree ("recipe_fingerprint");