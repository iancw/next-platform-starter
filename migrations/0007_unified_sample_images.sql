CREATE TABLE "recipe_sample_images" (
    "recipe_id" integer NOT NULL,
    "image_id" integer NOT NULL,
    "author_id" integer,
    CONSTRAINT "recipe_sample_images_pk" PRIMARY KEY("recipe_id","image_id")
);

ALTER TABLE "recipe_sample_images" ADD CONSTRAINT "recipe_sample_images_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "recipe_sample_images" ADD CONSTRAINT "recipe_sample_images_image_id_images_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."images"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "recipe_sample_images" ADD CONSTRAINT "recipe_sample_images_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;

CREATE INDEX "recipe_sample_images_recipe_id_idx" ON "recipe_sample_images" USING btree ("recipe_id");
CREATE INDEX "recipe_sample_images_author_id_idx" ON "recipe_sample_images" USING btree ("author_id");

DROP TABLE "recipe_author_samples";
DROP TABLE "recipe_community_samples";
