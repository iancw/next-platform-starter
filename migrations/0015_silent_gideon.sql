CREATE TABLE "mode_slot_assignments" (
	"user_id" integer NOT NULL,
	"mode_position" varchar(10) NOT NULL,
	"color_slot" smallint NOT NULL,
	"recipe_id" integer,
	CONSTRAINT "mode_slot_assignments_pk" PRIMARY KEY("user_id","mode_position","color_slot")
);
--> statement-breakpoint
ALTER TABLE "recipes" ADD COLUMN IF NOT EXISTS "source" text;--> statement-breakpoint
ALTER TABLE "mode_slot_assignments" ADD CONSTRAINT "mode_slot_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mode_slot_assignments" ADD CONSTRAINT "mode_slot_assignments_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "mode_slot_assignments_user_id_idx" ON "mode_slot_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mode_slot_assignments_recipe_id_idx" ON "mode_slot_assignments" USING btree ("recipe_id");