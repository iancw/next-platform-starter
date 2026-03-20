CREATE TABLE "authors" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "authors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"oidc_sub" text,
	"name" text NOT NULL,
	"instagram_link" text,
	"flickr_link" text,
	"website" text,
	"kofi_link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "images_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"author_id" integer NOT NULL,
	"dimensions" text,
	"camera" text,
	"lens" text,
	"original_file_size" integer,
	"exif_string" text,
	"full_size_url" text,
	"small_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_author_samples" (
	"recipe_id" integer NOT NULL,
	"image_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	CONSTRAINT "recipe_author_samples_pk" PRIMARY KEY("recipe_id","image_id")
);
--> statement-breakpoint
CREATE TABLE "recipe_community_samples" (
	"recipe_id" integer NOT NULL,
	"image_id" integer NOT NULL,
	"author_id" integer,
	CONSTRAINT "recipe_community_samples_pk" PRIMARY KEY("recipe_id","image_id")
);
--> statement-breakpoint
CREATE TABLE "recipe_comparison_images" (
	"recipe_id" integer NOT NULL,
	"image_id" integer NOT NULL,
	"label" text,
	CONSTRAINT "recipe_comparison_images_pk" PRIMARY KEY("recipe_id","image_id")
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "recipes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"author_id" integer NOT NULL,
	"slug" varchar(255) NOT NULL,
	"recipe_name" text NOT NULL,
	"author_name" text NOT NULL,
	"description" text,
	"yellow" smallint,
	"orange" smallint,
	"orange_red" smallint,
	"red" smallint,
	"magenta" smallint,
	"violet" smallint,
	"blue" smallint,
	"blue_cyan" smallint,
	"cyan" smallint,
	"green_cyan" smallint,
	"green" smallint,
	"yellow_green" smallint,
	"contrast" smallint,
	"sharpness" smallint,
	"highlights" smallint,
	"shadows" smallint,
	"midtones" smallint,
	"white_balance_2" text,
	"white_balance_temperature" integer,
	"white_balance_amber_offset" smallint,
	"white_balance_green_offset" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_author_samples" ADD CONSTRAINT "recipe_author_samples_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_author_samples" ADD CONSTRAINT "recipe_author_samples_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_author_samples" ADD CONSTRAINT "recipe_author_samples_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_community_samples" ADD CONSTRAINT "recipe_community_samples_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_community_samples" ADD CONSTRAINT "recipe_community_samples_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_community_samples" ADD CONSTRAINT "recipe_community_samples_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_comparison_images" ADD CONSTRAINT "recipe_comparison_images_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_comparison_images" ADD CONSTRAINT "recipe_comparison_images_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "authors_oidc_sub_unique" ON "authors" USING btree ("oidc_sub") WHERE "authors"."oidc_sub" is not null;--> statement-breakpoint
CREATE INDEX "authors_name_idx" ON "authors" USING btree ("name");--> statement-breakpoint
CREATE INDEX "images_author_id_idx" ON "images" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "recipe_author_samples_recipe_id_idx" ON "recipe_author_samples" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_author_samples_author_id_idx" ON "recipe_author_samples" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "recipe_community_samples_recipe_id_idx" ON "recipe_community_samples" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_community_samples_author_id_idx" ON "recipe_community_samples" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "recipe_comparison_images_recipe_id_idx" ON "recipe_comparison_images" USING btree ("recipe_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_slug_unique" ON "recipes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "recipes_recipe_name_idx" ON "recipes" USING btree ("recipe_name");--> statement-breakpoint
CREATE INDEX "recipes_author_id_idx" ON "recipes" USING btree ("author_id");