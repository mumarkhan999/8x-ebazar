# eBazar

A multi-vendor marketplace: independent sellers apply to open a store, an admin approves them, and shoppers buy from many stores in one checkout. Each store then fulfils its own part of the order.

Built for the 8x take-home. The original brief was an Amazon clone; it was later changed to "keep the idea and the backend, design your own interface". The backend from that first version (Neon Postgres, Drizzle, Auth.js, Stripe) was carried over and extended for multiple vendors. The UI was rebuilt from scratch with its own visual identity.

**Stack:** Next.js 16 (App Router, Server Components, Server Actions) · TypeScript · Tailwind CSS v4 · Neon serverless Postgres · Drizzle ORM · Auth.js v5 (credentials, JWT) · Stripe Checkout (test mode) · Cloudinary (optional image uploads)

## Roles

| Role | Can do |
| --- | --- |
| **Customer** | Browse, search, buy from several stores in one checkout, track each package, review delivered products |
| **Seller** | Everything a customer can, plus Seller Center: product CRUD with images, stock, publish/draft, fulfil orders (paid → packed → shipped → delivered), edit the store profile |
| **Admin** | Approve/reject store applications, suspend/reinstate stores, manage the category tree, block listings, hide reviews, see all orders and users |

Signup always creates a customer. Becoming a seller means applying at `/sell`; the account only gets the `seller` role once an admin approves the store. Admins are only created by the seed script.

## Demo accounts

After `npm run db:seed`, every account uses the password **`Password123`**.

| Email | What you'll see |
| --- | --- |
| `admin@ebazar.test` | Admin console — one pending application to approve |
| `seller@ebazar.test` | Seller Center for Voltline Electronics, with orders to fulfil |
| `buyer@ebazar.test` | Customer with order history, packages in transit, and a delivered item they can still review |
| `pending@ebazar.test` | A store application awaiting review |
| `rejected@ebazar.test` | A rejected application that can be edited and re-submitted |
| `flashmart@ebazar.test` | A suspended seller — store page and listings are hidden |

Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC.

## Architecture notes

**Data model** (`src/db/schema.ts`)
- `users.role` is `customer | seller | admin`. Each user owns at most one store (`stores.owner_id` is unique).
- `stores.status` is `pending → active | rejected`, and `active ⇄ suspended`.
- `categories` is a two-level tree. Products always sit in a leaf category.
- `products` belong to a store and have `draft | active | blocked` status (`blocked` is set by admins only). `product_images` holds an ordered gallery.
- **Orders are split by store.** One `orders` row is what the buyer pays for (one Stripe session). Each store involved gets a `sub_orders` row with its own fulfilment status. `order_items` hang off the sub-order and snapshot the title, image and price.
- `reviews` are unique per (product, user). `products.rating_avg` and `review_count` are denormalised and recomputed when a review is written or hidden.

**Authorization**
- `src/proxy.ts` only checks that a session exists on protected paths.
- `src/lib/dal.ts` does the real checks. The JWT carries just the user id; role and store status are read from the database on each request, so an approval or suspension takes effect immediately. `requireSeller()` requires role `seller` **and** an active store.
- Every seller query and mutation filters by the seller's own `store_id`, which comes from the session and never from the request. Calling a server action directly with another store's product id changes nothing.
- A product is visible on the storefront only if it is `active` **and** its store is `active` (`isVisible` in `src/lib/catalog.ts`). Suspending a store hides every listing at once.

**Checkout** (`src/app/api/checkout/route.ts`)
- Prices, stock and visibility are re-read from the database. Client prices are never trusted. Buying from your own store is rejected.
- The order, its sub-orders and its items are inserted together with `db.batch()`, which is atomic on the neon-http driver.
- `markOrderPaid` runs from both the Stripe webhook and the confirmation page, whichever arrives first. A conditional `status = 'pending'` update makes it idempotent, so stock and sold counts are only changed once.
- Sellers move sub-orders through an explicit state machine (`SELLER_TRANSITIONS`). The update compares and sets the current status, so two tabs can't race each other.

**Reviews:** only a buyer with a *delivered* sub-order containing the product can review it. Every review on the site is therefore a verified purchase.

**Images:** nothing is stored on our server. Sellers either upload to Cloudinary or paste any public `https` image URL.
- Uploads are signed. `/api/uploads/sign` checks the session, fixes the folder and allowed formats in a SHA-1 signature, and the browser then uploads straight to Cloudinary.
- Images aren't passed through Vercel's optimizer: that would need a wildcard `remotePatterns` and would turn the deployment into an open image proxy. Cloudinary images are resized by Cloudinary through URL transforms instead (`src/lib/images.ts`).

## Running locally

```bash
cp .env.example .env.local   # fill in DATABASE_URL, AUTH_SECRET, Stripe test keys
npm install
npm run db:push              # create tables
npm run db:seed              # demo data (wipes existing data)
npm run dev
```

For Stripe webhooks locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, then put the printed `whsec_…` in `STRIPE_WEBHOOK_SECRET`. Without the webhook, the confirmation page still confirms payment directly with Stripe.

## Project layout

```
src/
  app/(shop)/      storefront: home, search, category, deals, product, store, cart, checkout, account, sell
  app/seller/      Seller Center (role-gated layout)
  app/admin/       Admin console (role-gated layout)
  app/api/         auth, checkout, Stripe webhook, Cloudinary signing
  lib/             dal (auth checks), catalog / orders / reviews / admin / seller queries, server actions
  components/      UI building blocks
  db/              schema + seed
.agent-logs/       verbatim prompt/response logs of the AI-assisted build (captured by .claude/hooks)
```

## Working with AI agents

This project was built with Claude Code. `.claude/hooks/` records every prompt and response pair into `.agent-logs/`, so the full working session is reviewable, including design decisions, course corrections, and points where I pushed back on or changed the agent's suggestions.

---

eBazar is a demo built for an assignment. It isn't affiliated with any real marketplace. Product photos are from [Unsplash](https://unsplash.com).
