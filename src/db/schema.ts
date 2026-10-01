import { relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  numeric,
  jsonb,
  boolean,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

// A seller is a customer too (same account can shop). "seller" is only granted
// once an admin approves their store application.
export const userRole = pgEnum("user_role", ["customer", "seller", "admin"]);

export const storeStatus = pgEnum("store_status", [
  "pending", // applied, awaiting admin review
  "active", // approved, listings are visible
  "rejected", // application declined (may re-apply)
  "suspended", // was active, admin pulled it — listings hidden
]);

export const productStatus = pgEnum("product_status", [
  "draft", // seller hasn't published it
  "active", // visible (if the store is active too)
  "blocked", // admin removed it from the storefront
]);

export const orderStatus = pgEnum("order_status", [
  "pending", // Stripe session created, not paid yet
  "paid",
  "cancelled",
]);

// Per-store fulfilment, driven by the seller.
export const subOrderStatus = pgEnum("sub_order_status", [
  "pending",
  "paid",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").notNull().default("customer"),
  createdAt: createdAt(),
});

export const stores = pgTable(
  "stores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // One store per seller account.
    ownerId: uuid("owner_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    tagline: text("tagline").notNull().default(""),
    description: text("description").notNull().default(""),
    logoUrl: text("logo_url"),
    bannerUrl: text("banner_url"),
    status: storeStatus("status").notNull().default("pending"),
    // Shown to the seller when an application is rejected or a store suspended.
    statusNote: text("status_note"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("stores_status_idx").on(t.status)]
);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  // Two-level tree: top-level departments and their sub-categories.
  parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, {
    onDelete: "restrict",
  }),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    // Short bullet points shown near the price.
    highlights: jsonb("highlights").$type<string[]>().notNull().default([]),
    priceCents: integer("price_cents").notNull(),
    // Original price — when set and higher than priceCents, the product is "on deal".
    compareAtCents: integer("compare_at_cents"),
    stock: integer("stock").notNull().default(0),
    status: productStatus("status").notNull().default("active"),
    // Denormalised from reviews so listings don't need an aggregate join.
    ratingAvg: numeric("rating_avg", { precision: 2, scale: 1 })
      .notNull()
      .default("0"),
    reviewCount: integer("review_count").notNull().default(0),
    soldCount: integer("sold_count").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("products_store_idx").on(t.storeId),
    index("products_category_idx").on(t.categoryId),
    index("products_status_idx").on(t.status),
  ]
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    // Either a Cloudinary secure_url or any public https URL the seller pasted.
    url: text("url").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)]
);

// One payment from the buyer's point of view.
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: orderStatus("status").notNull().default("pending"),
    totalCents: integer("total_cents").notNull(),
    stripeSessionId: text("stripe_session_id"),
    shippingName: text("shipping_name").notNull(),
    shippingPhone: text("shipping_phone").notNull().default(""),
    shippingAddress: jsonb("shipping_address")
      .$type<{ line1: string; city: string; region: string; postalCode: string }>()
      .notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("orders_user_idx").on(t.userId)]
);

// The slice of an order a single store has to fulfil.
export const subOrders = pgTable(
  "sub_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "restrict" }),
    status: subOrderStatus("status").notNull().default("pending"),
    subtotalCents: integer("subtotal_cents").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("sub_orders_order_idx").on(t.orderId),
    index("sub_orders_store_idx").on(t.storeId),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subOrderId: uuid("sub_order_id")
      .notNull()
      .references(() => subOrders.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    // Snapshots so order history survives later product edits.
    titleSnapshot: text("title_snapshot").notNull(),
    imageUrlSnapshot: text("image_url_snapshot").notNull(),
    priceCentsSnapshot: integer("price_cents_snapshot").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [index("order_items_sub_order_idx").on(t.subOrderId)]
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    body: text("body").notNull(),
    // Admin moderation: hidden reviews don't show or count toward the rating.
    hidden: boolean("hidden").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("reviews_product_user_idx").on(t.productId, t.userId),
    index("reviews_product_idx").on(t.productId),
  ]
);

// ---------------------------------------------------------------------------
// Relations (for db.query.* with `with:`)
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ one, many }) => ({
  store: one(stores, { fields: [users.id], references: [stores.ownerId] }),
  orders: many(orders),
  reviews: many(reviews),
}));

export const storesRelations = relations(stores, ({ one, many }) => ({
  owner: one(users, { fields: [stores.ownerId], references: [users.id] }),
  products: many(products),
  subOrders: many(subOrders),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "category_parent",
  }),
  children: many(categories, { relationName: "category_parent" }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, { fields: [products.storeId], references: [stores.id] }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  reviews: many(reviews),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  subOrders: many(subOrders),
}));

export const subOrdersRelations = relations(subOrders, ({ one, many }) => ({
  order: one(orders, { fields: [subOrders.orderId], references: [orders.id] }),
  store: one(stores, { fields: [subOrders.storeId], references: [stores.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  subOrder: one(subOrders, {
    fields: [orderItems.subOrderId],
    references: [subOrders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type UserRole = (typeof userRole.enumValues)[number];
export type Store = typeof stores.$inferSelect;
export type StoreStatus = (typeof storeStatus.enumValues)[number];
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductStatus = (typeof productStatus.enumValues)[number];
export type ProductImage = typeof productImages.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type SubOrder = typeof subOrders.$inferSelect;
export type SubOrderStatus = (typeof subOrderStatus.enumValues)[number];
export type OrderItem = typeof orderItems.$inferSelect;
export type Review = typeof reviews.$inferSelect;
