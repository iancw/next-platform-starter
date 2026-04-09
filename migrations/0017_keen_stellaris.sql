ALTER TABLE "images" ADD COLUMN "prepared_recipe_id" integer;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "prepared_object_key" text;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "finalized_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_prepared_recipe_id_recipes_id_fk" FOREIGN KEY ("prepared_recipe_id") REFERENCES "public"."recipes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "images_prepared_recipe_id_idx" ON "images" USING btree ("prepared_recipe_id");--> statement-breakpoint
CREATE UNIQUE INDEX "images_prepared_object_key_unique" ON "images" USING btree ("prepared_object_key") WHERE "images"."prepared_object_key" is not null;