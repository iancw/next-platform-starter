ALTER TABLE "recipes" ADD COLUMN "color_fingerprint" text;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "color_tone_fingerprint" text;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "no_wb_fingerprint" text;--> statement-breakpoint
CREATE INDEX "recipes_color_fingerprint_idx" ON "recipes" USING btree ("color_fingerprint");--> statement-breakpoint
CREATE INDEX "recipes_color_tone_fingerprint_idx" ON "recipes" USING btree ("color_tone_fingerprint");--> statement-breakpoint
CREATE INDEX "recipes_no_wb_fingerprint_idx" ON "recipes" USING btree ("no_wb_fingerprint");