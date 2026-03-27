import { relations, sql } from 'drizzle-orm';
import {
    boolean,
    index,
    integer,
    pgTable,
    primaryKey,
    smallint,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar
} from 'drizzle-orm/pg-core';

/**
 * Schema notes / conventions:
 * - Postgres dialect (Neon via Netlify DB).
 * - `users` are first-party login identities (email + session-backed auth).
 * - `authors` are public recipe owners/profiles and may optionally belong to a user.
 */

export const users = pgTable(
    'users',
    {
        id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
        uuid: uuid('uuid').defaultRandom().notNull(),
        email: text('email').notNull(),
        emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
    },
    (t) => [uniqueIndex('users_uuid_unique').on(t.uuid), uniqueIndex('users_email_unique').on(t.email)]
);

export const authors = pgTable(
    'authors',
    {
        id: integer('id').primaryKey().generatedAlwaysAsIdentity(),

        // Public identifier used in URLs.
        uuid: uuid('uuid').defaultRandom().notNull(),

        // Legacy unused field kept temporarily to simplify the Auth0 removal migration.
        oidcSub: text('oidc_sub'),

        // Nullable so imported recipes can reference authors with no login identity.
        userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),

        name: text('name').notNull(),
        instagramLink: text('instagram_link'),
        flickrLink: text('flickr_link'),
        website: text('website'),
        kofiLink: text('kofi_link'),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
    },
    (t) => [
        uniqueIndex('authors_uuid_unique').on(t.uuid),
        uniqueIndex('authors_oidc_sub_unique').on(t.oidcSub).where(sql`${t.oidcSub} is not null`),
        index('authors_name_idx').on(t.name)
    ]
);

export const authMagicLinks = pgTable(
    'auth_magic_links',
    {
        id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
        userId: integer('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tokenHash: text('token_hash').notNull(),
        redirectTo: text('redirect_to'),
        requestedIp: text('requested_ip'),
        requestedUserAgent: text('requested_user_agent'),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        consumedAt: timestamp('consumed_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
    },
    (t) => [
        uniqueIndex('auth_magic_links_token_hash_unique').on(t.tokenHash),
        index('auth_magic_links_user_id_idx').on(t.userId),
        index('auth_magic_links_expires_at_idx').on(t.expiresAt)
    ]
);

export const authSessions = pgTable(
    'auth_sessions',
    {
        id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
        userId: integer('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        tokenHash: text('token_hash').notNull(),
        userAgent: text('user_agent'),
        ipAddress: text('ip_address'),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
        revokedAt: timestamp('revoked_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
    },
    (t) => [
        uniqueIndex('auth_sessions_token_hash_unique').on(t.tokenHash),
        index('auth_sessions_user_id_idx').on(t.userId),
        index('auth_sessions_expires_at_idx').on(t.expiresAt)
    ]
);

export const images = pgTable(
    'images',
    {
        id: integer('id').primaryKey().generatedAlwaysAsIdentity(),

        // Public identifier used in URLs.
        uuid: uuid('uuid').defaultRandom().notNull(),
        authorId: integer('author_id')
            .notNull()
            .references(() => authors.id, { onDelete: 'cascade' }),

        dimensions: text('dimensions'),
        camera: text('camera'),
        lens: text('lens'),
        originalFileSize: integer('original_file_size'),
        exif: text('exif_string'),
        validExif: boolean('valid_exif').default(false).notNull(),
        fullSizeUrl: text('full_size_url'),
        smallUrl: text('small_url'),
        sha256Hash: text('sha256_hash'),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
    },
    (t) => [
        uniqueIndex('images_uuid_unique').on(t.uuid),
        index('images_author_id_idx').on(t.authorId),
        uniqueIndex('images_sha256_hash_unique').on(t.sha256Hash).where(sql`${t.sha256Hash} is not null`)
    ]
);

export const recipes = pgTable(
    'recipes',
    {
        id: integer('id').primaryKey().generatedAlwaysAsIdentity(),

        // Public identifier used in URLs.
        uuid: uuid('uuid').defaultRandom().notNull(),

        authorId: integer('author_id')
            .notNull()
            .references(() => authors.id, { onDelete: 'restrict' }),

        slug: varchar('slug', { length: 255 }).notNull(),

        recipeName: text('recipe_name').notNull(),
        // Denormalized display name from the source schema/JSON.
        authorName: text('author_name').notNull(),
        description: text('description'),
        sourceUrl: text('source_url'),

        // Saturation wheel adjustments
        yellow: smallint('yellow'),
        orange: smallint('orange'),
        orangeRed: smallint('orange_red'),
        red: smallint('red'),
        magenta: smallint('magenta'),
        violet: smallint('violet'),
        blue: smallint('blue'),
        blueCyan: smallint('blue_cyan'),
        cyan: smallint('cyan'),
        greenCyan: smallint('green_cyan'),
        green: smallint('green'),
        yellowGreen: smallint('yellow_green'),

        // Sliders
        contrast: smallint('contrast'),
        sharpness: smallint('sharpness'),
        highlights: smallint('highlights'),
        shadows: smallint('shadows'),
        midtones: smallint('midtones'),

        // Additional OM image adjustments
        shadingEffect: smallint('shading_effect').notNull().default(0),
        exposureCompensation: smallint('exposure_compensation').notNull().default(0),

        // White balance
        whiteBalance2: text('white_balance_2'),
        whiteBalanceTemperature: integer('white_balance_temperature'),
        whiteBalanceAmberOffset: smallint('white_balance_amber_offset'),
        whiteBalanceGreenOffset: smallint('white_balance_green_offset'),

        // OES downloads are generated dynamically at /oes/<slug>.oes

        // Fingerprint of core recipe settings (for dedupe / matching).
        // Intentionally excludes shadingEffect and exposureCompensation.
        recipeFingerprint: text('recipe_fingerprint'),

        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
    },
    (t) => [
        uniqueIndex('recipes_uuid_unique').on(t.uuid),
        uniqueIndex('recipes_slug_unique').on(t.slug),
        index('recipes_recipe_fingerprint_idx').on(t.recipeFingerprint),
        index('recipes_recipe_name_idx').on(t.recipeName),
        index('recipes_author_id_idx').on(t.authorId)
    ]
);

export const recipeSampleImages = pgTable(
    'recipe_sample_images',
    {
        recipeId: integer('recipe_id')
            .notNull()
            .references(() => recipes.id, { onDelete: 'cascade' }),
        imageId: integer('image_id')
            .notNull()
            .references(() => images.id, { onDelete: 'cascade' }),
        authorId: integer('author_id').references(() => authors.id, { onDelete: 'set null' })
    },
    (t) => [
        primaryKey({ columns: [t.recipeId, t.imageId], name: 'recipe_sample_images_pk' }),
        index('recipe_sample_images_recipe_id_idx').on(t.recipeId),
        index('recipe_sample_images_author_id_idx').on(t.authorId)
    ]
);

// Join table for side-by-side / comparison images for a recipe.
// Intentionally does NOT include author_id; the image already belongs to an author.
export const recipeComparisonImages = pgTable(
    'recipe_comparison_images',
    {
        recipeId: integer('recipe_id')
            .notNull()
            .references(() => recipes.id, { onDelete: 'cascade' }),
        imageId: integer('image_id')
            .notNull()
            .references(() => images.id, { onDelete: 'cascade' }),

        // Optional display label for UI (e.g. "Before", "After", "RAW", "JPEG")
        label: text('label')
    },
    (t) => [
        primaryKey({ columns: [t.recipeId, t.imageId], name: 'recipe_comparison_images_pk' }),
        index('recipe_comparison_images_recipe_id_idx').on(t.recipeId)
    ]
);

export const savedRecipes = pgTable(
    'saved_recipes',
    {
        userId: integer('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        recipeId: integer('recipe_id')
            .notNull()
            .references(() => recipes.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
    },
    (t) => [
        primaryKey({ columns: [t.userId, t.recipeId], name: 'saved_recipes_pk' }),
        index('saved_recipes_user_id_idx').on(t.userId),
        index('saved_recipes_recipe_id_idx').on(t.recipeId)
    ]
);

export const usersRelations = relations(users, ({ many }) => ({
    authors: many(authors),
    magicLinks: many(authMagicLinks),
    sessions: many(authSessions),
    savedRecipes: many(savedRecipes)
}));

export const authorsRelations = relations(authors, ({ one, many }) => ({
    user: one(users, {
        fields: [authors.userId],
        references: [users.id]
    }),
    recipes: many(recipes),
    images: many(images),
    sampleImages: many(recipeSampleImages)
}));

export const imagesRelations = relations(images, ({ one, many }) => ({
    author: one(authors, {
        fields: [images.authorId],
        references: [authors.id]
    }),
    sampleFor: many(recipeSampleImages),
    comparisonImageFor: many(recipeComparisonImages)
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
    author: one(authors, {
        fields: [recipes.authorId],
        references: [authors.id]
    }),
    sampleImages: many(recipeSampleImages),
    comparisonImages: many(recipeComparisonImages),
    savedByUsers: many(savedRecipes)
}));

export const recipeSampleImagesRelations = relations(recipeSampleImages, ({ one }) => ({
    recipe: one(recipes, {
        fields: [recipeSampleImages.recipeId],
        references: [recipes.id]
    }),
    image: one(images, {
        fields: [recipeSampleImages.imageId],
        references: [images.id]
    }),
    author: one(authors, {
        fields: [recipeSampleImages.authorId],
        references: [authors.id]
    })
}));

export const recipeComparisonImagesRelations = relations(recipeComparisonImages, ({ one }) => ({
    recipe: one(recipes, {
        fields: [recipeComparisonImages.recipeId],
        references: [recipes.id]
    }),
    image: one(images, {
        fields: [recipeComparisonImages.imageId],
        references: [images.id]
    })
}));

export const savedRecipesRelations = relations(savedRecipes, ({ one }) => ({
    user: one(users, {
        fields: [savedRecipes.userId],
        references: [users.id]
    }),
    recipe: one(recipes, {
        fields: [savedRecipes.recipeId],
        references: [recipes.id]
    })
}));

export const authMagicLinksRelations = relations(authMagicLinks, ({ one }) => ({
    user: one(users, {
        fields: [authMagicLinks.userId],
        references: [users.id]
    })
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
    user: one(users, {
        fields: [authSessions.userId],
        references: [users.id]
    })
}));
