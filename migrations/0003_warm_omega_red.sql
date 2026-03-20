ALTER TABLE "authors" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN "uuid" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "authors_uuid_unique" ON "authors" USING btree ("uuid");--> statement-breakpoint
CREATE UNIQUE INDEX "images_uuid_unique" ON "images" USING btree ("uuid");--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_uuid_unique" ON "recipes" USING btree ("uuid");