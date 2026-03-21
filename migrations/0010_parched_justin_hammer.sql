CREATE TABLE "saved_recipes" (
	"user_id" integer NOT NULL,
	"recipe_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_recipes_pk" PRIMARY KEY("user_id","recipe_id")
);
--> statement-breakpoint
DROP INDEX IF EXISTS "authors_user_id_unique";--> statement-breakpoint
ALTER TABLE "saved_recipes" ADD CONSTRAINT "saved_recipes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_recipes" ADD CONSTRAINT "saved_recipes_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "saved_recipes_user_id_idx" ON "saved_recipes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "saved_recipes_recipe_id_idx" ON "saved_recipes" USING btree ("recipe_id");
