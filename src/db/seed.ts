// Standalone script run via `tsx`, outside Next's build — can't import
// "./index" since it pulls in the `server-only` guard, which throws
// unconditionally outside Next's bundler.
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { products } from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema: { products } });

// Real, relevant photos from unsplash.com (stable images.unsplash.com CDN
// URLs for already-published photos — fine to hotlink under the Unsplash
// License, no API key or attribution required). Picked per-product rather
// than generic stock photography.
function img(photoId: string) {
  return `https://images.unsplash.com/${photoId}?w=800&h=800&fit=crop&q=80&auto=format`;
}

const catalog = [
  // Electronics
  {
    slug: "wireless-noise-cancelling-headphones",
    title: "AuraSound Wireless Noise-Cancelling Headphones, Over-Ear, 40hr Battery",
    description:
      "Industry-leading active noise cancellation with adaptive sound control. 40-hour battery life, multipoint Bluetooth, and plush memory-foam ear cups for all-day comfort.",
    priceCents: 24899,
    category: "Electronics",
    imageUrl: img("photo-1628116709703-c1c9ad550d36"),
    rating: "4.6",
    reviewCount: 18234,
  },
  {
    slug: "4k-streaming-media-player",
    title: "StreamBox 4K Ultra HD Streaming Media Player with Voice Remote",
    description:
      "Stream in stunning 4K with Dolby Vision and Atmos support. Voice remote with app shortcuts, and access to 500,000+ movies and TV episodes.",
    priceCents: 4999,
    category: "Electronics",
    imageUrl: img("photo-1593359677879-a4bb92f829d1"),
    rating: "4.4",
    reviewCount: 52011,
  },
  {
    slug: "portable-bluetooth-speaker",
    title: "SonicWave Portable Bluetooth Speaker, Waterproof, 24-Hour Playtime",
    description:
      "Rich, room-filling sound in a compact waterproof design. IPX7 rated, pair two for stereo sound, 24-hour battery life.",
    priceCents: 5999,
    category: "Electronics",
    imageUrl: img("photo-1608043152269-423dbba4e7e1"),
    rating: "4.7",
    reviewCount: 31500,
  },
  {
    slug: "usb-c-fast-charger-65w",
    title: "PowerNode 65W USB-C Fast Charger, 3-Port GaN Charger",
    description:
      "Compact GaN charger delivers 65W fast charging across three ports. Charges laptops, phones, and tablets simultaneously.",
    priceCents: 2599,
    category: "Electronics",
    imageUrl: img("photo-1583863788434-e58a36330cf0"),
    rating: "4.5",
    reviewCount: 9021,
  },
  {
    slug: "mechanical-keyboard-rgb",
    title: "KeyForge TKL Mechanical Keyboard, Hot-Swappable, RGB Backlit",
    description:
      "Tenkeyless mechanical keyboard with hot-swappable switches, per-key RGB lighting, and a durable aluminum frame.",
    priceCents: 8999,
    category: "Electronics",
    imageUrl: img("photo-1626958390943-a70309376444"),
    rating: "4.6",
    reviewCount: 4210,
  },
  {
    slug: "27-inch-4k-monitor",
    title: 'ClearView 27" 4K UHD Monitor, USB-C, 99% sRGB',
    description:
      "Crisp 4K resolution with 99% sRGB coverage, USB-C with 65W power delivery, and an adjustable ergonomic stand.",
    priceCents: 32999,
    category: "Electronics",
    imageUrl: img("photo-1619597455322-4fbbd820250a"),
    rating: "4.5",
    reviewCount: 6789,
  },

  // Home & Kitchen
  {
    slug: "stainless-steel-air-fryer",
    title: "CrispAir 6-Quart Digital Air Fryer, Stainless Steel",
    description:
      "Family-size 6-quart capacity with 8 preset cooking programs. Dishwasher-safe basket and a sleek stainless steel finish.",
    priceCents: 8499,
    category: "Home & Kitchen",
    imageUrl: img("photo-1774074645537-f72f70d40d12"),
    rating: "4.7",
    reviewCount: 41022,
  },
  {
    slug: "robot-vacuum-mop-combo",
    title: "TidyBot Robot Vacuum and Mop Combo with App Control",
    description:
      "Smart navigation maps your home for efficient cleaning. Vacuums and mops in one pass, controllable from the companion app.",
    priceCents: 19999,
    category: "Home & Kitchen",
    imageUrl: img("photo-1653990480360-31a12ce9723e"),
    rating: "4.3",
    reviewCount: 12873,
  },
  {
    slug: "programmable-coffee-maker",
    title: "BrewMaster 12-Cup Programmable Coffee Maker with Thermal Carafe",
    description:
      "Wake up to fresh coffee with 24-hour programmable brewing. Thermal carafe keeps coffee hot for hours without a warming plate.",
    priceCents: 5499,
    category: "Home & Kitchen",
    imageUrl: img("photo-1565452344518-47faca79dc69"),
    rating: "4.5",
    reviewCount: 15644,
  },
  {
    slug: "egyptian-cotton-sheet-set",
    title: "LuxeLinen 100% Egyptian Cotton Sheet Set, Queen, 800 Thread Count",
    description:
      "Silky-soft 800 thread count Egyptian cotton sheets. Set includes flat sheet, fitted sheet, and two pillowcases.",
    priceCents: 6999,
    category: "Home & Kitchen",
    imageUrl: img("photo-1547104442-044448b73426"),
    rating: "4.6",
    reviewCount: 8901,
  },
  {
    slug: "nonstick-cookware-set",
    title: "ChefPro 10-Piece Nonstick Cookware Set, Dishwasher Safe",
    description:
      "Complete kitchen set with pots and pans in a durable nonstick coating. Oven-safe up to 400°F and dishwasher safe.",
    priceCents: 12999,
    category: "Home & Kitchen",
    imageUrl: img("photo-1584990347193-6bebebfeaeee"),
    rating: "4.4",
    reviewCount: 7321,
  },
  {
    slug: "led-desk-lamp",
    title: "GlowDesk LED Desk Lamp with Wireless Charging Base",
    description:
      "Adjustable LED lamp with 5 color modes and 7 brightness levels. Built-in wireless charging pad for compatible phones.",
    priceCents: 3499,
    category: "Home & Kitchen",
    imageUrl: img("photo-1574025876844-6c9ba8602866"),
    rating: "4.5",
    reviewCount: 5678,
  },

  // Books
  {
    slug: "atomic-habits-book",
    title: "Atomic Habits: An Easy & Proven Way to Build Good Habits",
    description:
      "A groundbreaking guide to building good habits and breaking bad ones, one small change at a time.",
    priceCents: 1699,
    category: "Books",
    imageUrl: img("photo-1610116306796-6fea9f4fae38"),
    rating: "4.8",
    reviewCount: 128933,
  },
  {
    slug: "project-hail-mary-book",
    title: "Project Hail Mary: A Novel",
    description:
      "A lone astronaut must save humanity from extinction in this thrilling, science-driven adventure.",
    priceCents: 1499,
    category: "Books",
    imageUrl: img("photo-1457369804613-52c61a468e7d"),
    rating: "4.9",
    reviewCount: 87211,
  },
  {
    slug: "the-psychology-of-money-book",
    title: "The Psychology of Money: Timeless Lessons on Wealth and Happiness",
    description:
      "Explores the strange ways people think about money and teaches you how to make better sense of one of life's most important topics.",
    priceCents: 1399,
    category: "Books",
    imageUrl: img("photo-1604866830893-c13cafa515d5"),
    rating: "4.7",
    reviewCount: 65210,
  },

  // Toys & Games
  {
    slug: "1000-piece-jigsaw-puzzle",
    title: "Wanderlust 1000-Piece Jigsaw Puzzle, World Map",
    description:
      "A vibrant 1000-piece puzzle featuring an illustrated world map. Finished size 27x20 inches, great for family game night.",
    priceCents: 1899,
    category: "Toys & Games",
    imageUrl: img("photo-1612611741189-a9b9eb01d515"),
    rating: "4.7",
    reviewCount: 9421,
  },
  {
    slug: "remote-control-stunt-car",
    title: "TurboFlip Remote Control Stunt Car, 360° Rotation",
    description:
      "High-speed RC car with 360-degree flips and rotations. Rechargeable battery included for up to 30 minutes of play.",
    priceCents: 3299,
    category: "Toys & Games",
    imageUrl: img("photo-1758964087156-0eac97044f84"),
    rating: "4.3",
    reviewCount: 5510,
  },
  {
    slug: "strategy-board-game",
    title: "Settlers of Catan-Style Strategy Board Game, 3-4 Players",
    description:
      "Build, trade, and settle in this classic strategy board game for family and friends. 60-90 minute playtime.",
    priceCents: 4499,
    category: "Toys & Games",
    imageUrl: img("photo-1676651471150-0e3a5f8de05e"),
    rating: "4.8",
    reviewCount: 22318,
  },

  // Beauty & Personal Care
  {
    slug: "vitamin-c-serum",
    title: "GlowLab Vitamin C Serum with Hyaluronic Acid, 1 fl oz",
    description:
      "Brightening antioxidant serum with 20% vitamin C and hyaluronic acid to hydrate and even skin tone.",
    priceCents: 2299,
    category: "Beauty & Personal Care",
    imageUrl: img("photo-1741896135512-084b251887f7"),
    rating: "4.5",
    reviewCount: 34122,
  },
  {
    slug: "electric-toothbrush",
    title: "SonicClean Rechargeable Electric Toothbrush, 5 Modes",
    description:
      "Sonic vibration technology with 5 cleaning modes and a 2-week battery life. Includes travel case and 2 brush heads.",
    priceCents: 3999,
    category: "Beauty & Personal Care",
    imageUrl: img("photo-1559591937-abc5678da6ad"),
    rating: "4.6",
    reviewCount: 19832,
  },
  {
    slug: "hair-dryer-ionic",
    title: "SilkAir Ionic Hair Dryer with Diffuser, 1875W",
    description:
      "Professional-grade ionic hair dryer reduces frizz and drying time. Includes concentrator and diffuser attachments.",
    priceCents: 4499,
    category: "Beauty & Personal Care",
    imageUrl: img("photo-1727364438136-6edc10ef0a52"),
    rating: "4.4",
    reviewCount: 11290,
  },

  // Sports & Outdoors
  {
    slug: "yoga-mat-extra-thick",
    title: "ZenFlex Extra Thick Yoga Mat with Carry Strap, 1/2 Inch",
    description:
      "Extra cushioning for joint support during yoga and floor exercises. Non-slip texture on both sides, includes carry strap.",
    priceCents: 2799,
    category: "Sports & Outdoors",
    imageUrl: img("photo-1646239646963-b0b9be56d6b5"),
    rating: "4.7",
    reviewCount: 27654,
  },
  {
    slug: "insulated-water-bottle",
    title: "HydroFlow 32oz Insulated Stainless Steel Water Bottle",
    description:
      "Double-wall vacuum insulation keeps drinks cold for 24 hours or hot for 12. Leak-proof lid with carry handle.",
    priceCents: 2199,
    category: "Sports & Outdoors",
    imageUrl: img("photo-1544003484-3cd181d17917"),
    rating: "4.8",
    reviewCount: 43120,
  },
  {
    slug: "adjustable-dumbbell-set",
    title: "FlexForce Adjustable Dumbbell Set, 5-52.5 lbs (Pair)",
    description:
      "Space-saving adjustable dumbbells replace 15 sets of weights. Quick-select dial changes weight in seconds.",
    priceCents: 34999,
    category: "Sports & Outdoors",
    imageUrl: img("photo-1638536532686-d610adfc8e5c"),
    rating: "4.6",
    reviewCount: 8765,
  },

  // Office Products
  {
    slug: "ergonomic-office-chair",
    title: "SupportPlus Ergonomic Mesh Office Chair with Lumbar Support",
    description:
      "Breathable mesh back with adjustable lumbar support, armrests, and headrest. Rated for up to 300 lbs.",
    priceCents: 15999,
    category: "Office Products",
    imageUrl: img("photo-1688578735352-9a6f2ac3b70a"),
    rating: "4.4",
    reviewCount: 16543,
  },
  {
    slug: "standing-desk-converter",
    title: "RiseUp Standing Desk Converter, Height Adjustable, 28-Inch",
    description:
      "Transform any desk into a standing desk. Smooth gas-spring height adjustment fits dual monitors and a laptop.",
    priceCents: 12499,
    category: "Office Products",
    imageUrl: img("photo-1623177623442-979c1e42c255"),
    rating: "4.5",
    reviewCount: 9982,
  },
] as const;

async function main() {
  console.log(`Seeding ${catalog.length} products...`);
  for (const product of catalog) {
    await db
      .insert(products)
      .values(product)
      .onConflictDoUpdate({
        target: products.slug,
        set: {
          title: product.title,
          description: product.description,
          priceCents: product.priceCents,
          category: product.category,
          imageUrl: product.imageUrl,
          rating: product.rating,
          reviewCount: product.reviewCount,
        },
      });
  }
  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
