// Standalone script run via `tsx` (npm run db:seed), outside Next's build —
// can't import "./index" since it pulls in the `server-only` guard.
//
// Wipes and re-creates demo data: categories, an admin, sellers with stores in
// every lifecycle state, a catalogue, order history and the reviews that
// history allows. All randomness is seeded, so every run produces the same data.
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

const {
  users,
  stores,
  categories,
  products,
  productImages,
  orders,
  subOrders,
  orderItems,
  reviews,
} = schema;

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });

const DEMO_PASSWORD = "Password123";

// --- deterministic randomness -------------------------------------------------
let seed = 8;
function rand() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000 - Math.floor(rand() * 86_400_000));

// --- images -------------------------------------------------------------------
// Real photos from unsplash.com (hotlinking images.unsplash.com is allowed by
// the Unsplash License). Each was checked by eye: no prominent third-party
// brand logos. Gallery shots 2 and 3 are focal-point crops of the same photo.
const unsplash = (id: string, extra = "") =>
  `https://images.unsplash.com/${id}?w=900&h=900&fit=crop&q=80&auto=format${extra}`;
const gallery = (id: string) => [
  unsplash(id),
  unsplash(id, "&crop=focalpoint&fp-x=0.38&fp-y=0.42&fp-z=1.7"),
  unsplash(id, "&crop=focalpoint&fp-x=0.62&fp-y=0.58&fp-z=2.2"),
];

// --- categories ---------------------------------------------------------------
const CATEGORY_TREE: [string, string, [string, string][]][] = [
  ["Electronics", "electronics", [["Audio", "audio"], ["Computer Accessories", "computer-accessories"], ["Phones & Wearables", "phones-wearables"]]],
  ["Fashion", "fashion", [["Men's Clothing", "mens-clothing"], ["Women's Clothing", "womens-clothing"], ["Footwear", "footwear"], ["Bags", "bags"], ["Watches", "watches"]]],
  ["Home & Living", "home-living", [["Kitchen", "kitchen"], ["Bedding", "bedding"], ["Lighting", "lighting"], ["Cleaning", "cleaning"], ["Furniture", "furniture"]]],
  ["Health & Beauty", "health-beauty", [["Skincare", "skincare"], ["Personal Care", "personal-care"]]],
  ["Sports & Outdoors", "sports-outdoors", [["Fitness", "fitness"], ["Hydration", "hydration"]]],
  ["Books & Office", "books-office", [["Books", "books"], ["Office", "office"]]],
  ["Toys & Games", "toys-games", [["Puzzles & Board Games", "puzzles-board-games"], ["RC & Vehicles", "rc-vehicles"]]],
];

// --- people & stores ----------------------------------------------------------
type StoreSeed = {
  key: string;
  owner: [name: string, email: string];
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logo?: string;
  banner?: string;
  status: schema.StoreStatus;
  statusNote?: string;
};

const STORES: StoreSeed[] = [
  {
    key: "volt",
    owner: ["Bilal Ahmed", "seller@ebazar.test"],
    name: "Voltline Electronics",
    slug: "voltline-electronics",
    tagline: "Audio, wearables & desk upgrades — tested before they ship.",
    description:
      "Voltline started as a weekend stall for headphone repairs. Today we stock audio gear, wearables and desk accessories we use ourselves. Every order is bench-tested before dispatch and ships within 24 hours.",
    logo: unsplash("photo-1583394838336-acd977736f90", "&w=200&h=200"),
    banner: unsplash("photo-1626958390943-a70309376444", "&w=1600&h=400"),
    status: "active",
  },
  {
    key: "hearth",
    owner: ["Sara Malik", "hearth@ebazar.test"],
    name: "Hearth & Home Co.",
    slug: "hearth-and-home",
    tagline: "Kitchen, bedding and the small things that make a home.",
    description:
      "Practical homeware chosen for daily use: cookware that lasts, linen that softens with every wash and lighting for late-night reading.",
    logo: unsplash("photo-1584990347193-6bebebfeaeee", "&w=200&h=200"),
    banner: unsplash("photo-1547104442-044448b73426", "&w=1600&h=400"),
    status: "active",
  },
  {
    key: "thread",
    owner: ["Hamza Qureshi", "threadhouse@ebazar.test"],
    name: "Threadhouse",
    slug: "threadhouse",
    tagline: "Everyday clothing, cut well and made to be worn often.",
    description:
      "Threadhouse makes essentials — tees, hoodies, shirts — in small runs, plus a curated shelf of shoes, bags and watches to go with them.",
    logo: unsplash("photo-1581655353564-df123a1eb820", "&w=200&h=200"),
    banner: unsplash("photo-1434389677669-e08b4cac3105", "&w=1600&h=400"),
    status: "active",
  },
  {
    key: "glow",
    owner: ["Zara Khan", "glow@ebazar.test"],
    name: "Glow Theory",
    slug: "glow-theory",
    tagline: "Skincare and grooming without the hype.",
    description: "Small-batch serums and dependable grooming tools. Ingredients listed in full, always.",
    logo: unsplash("photo-1741896135512-084b251887f7", "&w=200&h=200"),
    status: "active",
  },
  {
    key: "page",
    owner: ["Omar Siddiqui", "pageturner@ebazar.test"],
    name: "Pageturner Books & Games",
    slug: "pageturner",
    tagline: "Books, board games and a better desk to enjoy them at.",
    description:
      "An independent bookshop that grew a games corner, then an office corner. Gift-wrapping on request.",
    logo: unsplash("photo-1457369804613-52c61a468e7d", "&w=200&h=200"),
    banner: unsplash("photo-1604866830893-c13cafa515d5", "&w=1600&h=400"),
    status: "active",
  },
  {
    key: "peak",
    owner: ["Fatima Noor", "peakform@ebazar.test"],
    name: "Peak Form Sports",
    slug: "peak-form",
    tagline: "Home-gym gear for people who actually train.",
    description: "Weights, mats and bottles from a team of coaches. If we wouldn't use it in our own gym, we don't sell it.",
    logo: unsplash("photo-1638536532686-d610adfc8e5c", "&w=200&h=200"),
    banner: unsplash("photo-1517836357463-d25dfeac3438", "&w=1600&h=400"),
    status: "active",
  },
  {
    key: "flash",
    owner: ["Usman Tariq", "flashmart@ebazar.test"],
    name: "Flashmart Outlet",
    slug: "flashmart-outlet",
    tagline: "Unbeatable prices on everything.",
    description: "Clearance stock from everywhere.",
    status: "suspended",
    statusNote: "Suspended after repeated buyer reports of counterfeit listings. Contact support to appeal.",
  },
  {
    key: "nova",
    owner: ["Hira Javed", "pending@ebazar.test"],
    name: "Nova Gadgets",
    slug: "nova-gadgets",
    tagline: "Phone accessories and smart-home bits.",
    description: "We import and test phone cases, chargers and smart plugs. Looking to list ~40 SKUs at launch.",
    status: "pending",
  },
  {
    key: "quick",
    owner: ["Kamran Ali", "rejected@ebazar.test"],
    name: "Quick Cash Deals",
    slug: "quick-cash-deals",
    tagline: "Get rich quick!",
    description: "Gift cards at 70% off.",
    status: "rejected",
    statusNote: "Gift-card resale isn't allowed on eBazar. You're welcome to re-apply with a different catalogue.",
  },
];

const CUSTOMERS: [string, string][] = [
  ["Ali Raza", "buyer@ebazar.test"],
  ["Mariam Saeed", "mariam@ebazar.test"],
  ["Daniyal Shah", "daniyal@ebazar.test"],
  ["Noor Fatima", "noor@ebazar.test"],
  ["Ahmed Hassan", "ahmed@ebazar.test"],
  ["Sana Iqbal", "sana@ebazar.test"],
  ["Yusuf Karim", "yusuf@ebazar.test"],
  ["Ayesha Rehman", "ayesha@ebazar.test"],
  ["Imran Butt", "imran@ebazar.test"],
];

// --- catalogue ----------------------------------------------------------------
type ProductSeed = {
  store: string;
  category: string;
  title: string;
  price: number;
  compareAt?: number;
  stock: number;
  image: string;
  highlights: string[];
  description: string;
  status?: schema.ProductStatus;
};

const PRODUCTS: ProductSeed[] = [
  // Voltline Electronics
  { store: "volt", category: "audio", title: "AuraSound ANC Wireless Headphones, 40-Hour Battery", price: 189.99, compareAt: 249.99, stock: 34, image: "photo-1628116709703-c1c9ad550d36",
    highlights: ["Adaptive active noise cancellation", "40-hour battery, 10-min quick charge = 5 hours", "Multipoint Bluetooth 5.3", "Memory-foam ear cushions"],
    description: "Over-ear headphones that tune their noise cancellation to where you are — quieter on a plane, more open on a street. The aluminium headband and memory-foam cushions are built for long listening sessions, and multipoint pairing keeps your laptop and phone connected at the same time." },
  { store: "volt", category: "audio", title: "Halo Studio Over-Ear Headphones, Closed-Back", price: 99.99, stock: 22, image: "photo-1505740420928-5e560c06d30e",
    highlights: ["50 mm dynamic drivers", "Closed-back for isolation", "Detachable 1.2 m cable", "Folds flat for travel"],
    description: "A closed-back studio pair with a balanced, honest sound signature — good for mixing, better for long nights of music. Detachable cable and replaceable ear pads keep them going for years." },
  { store: "volt", category: "audio", title: "Wired Monitor Headphones with Coiled Cable", price: 39.99, compareAt: 59.99, stock: 61, image: "photo-1583394838336-acd977736f90",
    highlights: ["Neutral studio tuning", "3 m coiled cable + 6.35 mm adapter", "Swivel ear cups", "Lightweight 240 g"],
    description: "No batteries, no pairing, no latency. Plug these into an interface, a keyboard or a laptop and get flat, detailed monitoring sound." },
  { store: "volt", category: "audio", title: "PocketBuds True Wireless Earbuds with Charging Case", price: 49.99, compareAt: 79.99, stock: 88, image: "photo-1590658268037-6bf12165a8df",
    highlights: ["28 hours with the case", "IPX4 sweat resistance", "Touch controls", "Three ear-tip sizes"],
    description: "Compact earbuds that disappear in your ears and in your pocket. Good seal, punchy sound and a case that tops them up three times over." },
  { store: "volt", category: "computer-accessories", title: "KeyForge 75% Mechanical Keyboard, Hot-Swappable, RGB", price: 89.99, compareAt: 109.99, stock: 27, image: "photo-1626958390943-a70309376444",
    highlights: ["Hot-swappable switches", "Per-key RGB", "USB-C + Bluetooth", "Gasket-mounted plate"],
    description: "A compact 75% layout with a gasket-mounted plate for a soft, quiet typing feel. Swap switches without soldering and connect to up to three devices." },
  { store: "volt", category: "computer-accessories", title: "ClearView 27\" 4K IPS Monitor, USB-C 65W", price: 329.99, compareAt: 379.99, stock: 9, image: "photo-1619597455322-4fbbd820250a",
    highlights: ["3840×2160 IPS, 99% sRGB", "USB-C with 65 W charging", "Height & tilt adjustable", "Factory calibrated"],
    description: "One cable to your laptop for picture, power and peripherals. Sharp 4K text, accurate colour out of the box, and a stand that actually adjusts." },
  { store: "volt", category: "computer-accessories", title: "PowerNode 65W USB-C GaN Wall Charger", price: 25.99, compareAt: 34.99, stock: 140, image: "photo-1583863788434-e58a36330cf0",
    highlights: ["65 W single-port output", "GaN — 40% smaller than standard", "Charges laptops, tablets & phones", "Foldable prongs"],
    description: "Small enough for a jacket pocket and powerful enough for most laptops. Replaces the brick that came in the box." },
  { store: "volt", category: "phones-wearables", title: "Pulse Smartwatch S4 with Heart-Rate & GPS", price: 149.99, compareAt: 199.99, stock: 40, image: "photo-1546868871-7041f2a55e12",
    highlights: ["Built-in GPS", "Heart-rate & SpO2", "7-day battery", "5 ATM water resistant"],
    description: "A bright always-on display, accurate GPS for runs and rides, and a battery that lasts a full week of normal use." },
  { store: "volt", category: "phones-wearables", title: "Nimbus 6.1\" Smartphone, 128 GB, Dual SIM", price: 399, compareAt: 449, stock: 15, image: "photo-1511707171634-5f897ff02aa9",
    highlights: ["6.1\" OLED, 120 Hz", "128 GB storage", "Dual SIM", "Two-day battery"],
    description: "A compact phone with a smooth OLED screen, a camera that handles low light and the battery life to get through a weekend." },
  { store: "volt", category: "phones-wearables", title: "Minimal Fitness Band Watch, White", price: 59.99, stock: 52, image: "photo-1523275335684-37898b6baf30",
    highlights: ["Step & sleep tracking", "14-day battery", "Soft silicone strap", "Notifications from your phone"],
    description: "A clean, minimal tracker that looks like a watch. Two weeks per charge and just the stats you'll actually check." },

  // Hearth & Home
  { store: "hearth", category: "kitchen", title: "Stainless Steel Air Fryer, 5.8 qt, 8 Presets", price: 84.99, compareAt: 119.99, stock: 30, image: "photo-1774074645537-f72f70d40d12",
    highlights: ["5.8 qt basket", "8 one-touch presets", "Dishwasher-safe basket", "Up to 85% less oil"],
    description: "Crisp fries, wings and vegetables with a fraction of the oil. The stainless body wipes clean and the basket goes in the dishwasher." },
  { store: "hearth", category: "kitchen", title: "Nonstick Cookware Set, 10 Pieces, Induction-Ready", price: 129.99, compareAt: 169.99, stock: 18, image: "photo-1584990347193-6bebebfeaeee",
    highlights: ["PFOA-free nonstick", "Works on induction", "Oven-safe to 230 °C", "Tempered glass lids"],
    description: "Two frying pans, three saucepans and a stockpot with lids — everything for a first kitchen or a long-overdue upgrade." },
  { store: "hearth", category: "bedding", title: "Egyptian Cotton Sheet Set, 600 Thread Count, Queen", price: 69.99, stock: 44, image: "photo-1547104442-044448b73426",
    highlights: ["100% long-staple cotton", "Sateen weave", "Deep 40 cm pockets", "Softens with every wash"],
    description: "Smooth, cool sateen sheets that get better over time. Includes a flat sheet, a fitted sheet and two pillowcases." },
  { store: "hearth", category: "lighting", title: "Architect LED Desk Lamp with Clamp", price: 34.99, stock: 57, image: "photo-1574025876844-6c9ba8602866",
    highlights: ["Swing-arm design", "3 colour temperatures", "Desk clamp included", "Flicker-free LED"],
    description: "The classic swing-arm lamp, updated with a flicker-free LED head. Clamps to any desk edge up to 6 cm thick." },
  { store: "hearth", category: "cleaning", title: "Robot Vacuum & Mop with Lidar Mapping", price: 199.99, compareAt: 279.99, stock: 12, image: "photo-1653990480360-31a12ce9723e",
    highlights: ["Lidar room mapping", "Vacuums and mops in one pass", "2.5-hour runtime", "No-go zones in the app"],
    description: "Maps your home on the first run, then cleans room by room. Set no-go zones around pet bowls and cables from your phone." },
  { store: "hearth", category: "furniture", title: "Scandi Moulded Dining Chair, Beech Legs", price: 79.99, compareAt: 99.99, stock: 24, image: "photo-1592078615290-033ee584e267",
    highlights: ["Moulded seat with cushion", "Solid beech legs", "Floor-protecting pads", "Easy 5-minute assembly"],
    description: "A comfortable, wipe-clean dining chair with solid beech legs. Looks right around a dining table or at a desk." },

  // Threadhouse
  { store: "thread", category: "mens-clothing", title: "Essential Cotton Crew Tee, White", price: 14.99, compareAt: 19.99, stock: 200, image: "photo-1521572163474-6864f9cf17ab",
    highlights: ["180 gsm combed cotton", "Pre-shrunk", "Reinforced collar", "Regular fit"],
    description: "The white tee you'll reach for first. Mid-weight cotton that holds its shape and a collar that won't go wavy." },
  { store: "thread", category: "mens-clothing", title: "Heavyweight Blank Tee, Boxy Fit", price: 12.99, stock: 160, image: "photo-1581655353564-df123a1eb820",
    highlights: ["240 gsm heavyweight cotton", "Boxy, dropped shoulder", "Garment dyed"],
    description: "A thick, structured tee with a relaxed boxy cut. Great on its own or under an open shirt." },
  { store: "thread", category: "mens-clothing", title: "\"Original\" Graphic Print Tee", price: 19.99, compareAt: 29.99, stock: 75, image: "photo-1576566588028-4147f3842f27",
    highlights: ["Screen-printed front", "Soft-hand ink", "Unisex fit"],
    description: "Bold screen-printed graphic on a soft cotton tee. Printed in-house in small runs." },
  { store: "thread", category: "mens-clothing", title: "Classic Pullover Hoodie, Heather Grey", price: 39.99, compareAt: 54.99, stock: 64, image: "photo-1556821840-3a63f95609a7",
    highlights: ["Brushed fleece inside", "Double-layer hood", "Kangaroo pocket", "Ribbed cuffs"],
    description: "A warm, heavyweight hoodie with a brushed interior. The hood actually stays up." },
  { store: "thread", category: "mens-clothing", title: "Slim-Fit Oxford Dress Shirt, White", price: 34.99, stock: 48, image: "photo-1598033129183-c4f50c736f10",
    highlights: ["Non-iron finish", "Slim fit", "Spread collar", "Mother-of-pearl buttons"],
    description: "A crisp shirt for interviews, weddings and Mondays. Comes out of the dryer ready to wear." },
  { store: "thread", category: "womens-clothing", title: "Hand-Knit Fringe Poncho, Cream", price: 44.99, compareAt: 59.99, stock: 20, image: "photo-1434389677669-e08b4cac3105",
    highlights: ["Hand-knit open weave", "Cotton blend", "One size", "Fringed hem"],
    description: "An airy, hand-knit layer for cool evenings. Throw it over a dress or a tee." },
  { store: "thread", category: "footwear", title: "Teal Suede Brogues, Leather Sole", price: 89.99, compareAt: 119.99, stock: 16, image: "photo-1560343090-f0409e92791a",
    highlights: ["Genuine suede upper", "Leather sole", "Goodyear welted", "True to size"],
    description: "A statement brogue in rich teal suede. Welted construction means they can be resoled for years." },
  { store: "thread", category: "footwear", title: "Featherlight Running Shoes, Graphite", price: 69.99, compareAt: 89.99, stock: 38, image: "photo-1491553895911-0055eca6402d",
    highlights: ["210 g per shoe", "Responsive foam midsole", "Breathable knit upper"],
    description: "A light daily trainer for easy miles and gym sessions. Soft underfoot without feeling mushy." },
  { store: "thread", category: "bags", title: "Commuter Backpack 22L, Water-Resistant", price: 49.99, stock: 55, image: "photo-1553062407-98eeb64c6a62",
    highlights: ["Fits a 16\" laptop", "Water-resistant fabric", "Hidden passport pocket", "Luggage strap"],
    description: "A clean, structured backpack for the office and the weekend away. Padded laptop sleeve and a stash pocket on the back panel." },
  { store: "thread", category: "watches", title: "Leather-Strap Dress Watch, 40 mm", price: 119.99, compareAt: 159.99, stock: 14, image: "photo-1491336477066-31156b5e4f35",
    highlights: ["Sapphire-coated crystal", "Japanese quartz movement", "Italian leather strap", "3 ATM"],
    description: "A classic dress watch with a clean dial and a tan leather strap that ages nicely." },

  // Glow Theory
  { store: "glow", category: "skincare", title: "Vitamin C Brightening Serum, 30 ml", price: 22.99, compareAt: 29.99, stock: 90, image: "photo-1741896135512-084b251887f7",
    highlights: ["15% L-ascorbic acid", "With vitamin E & ferulic acid", "Fragrance-free", "Glass dropper bottle"],
    description: "A stable vitamin C serum to brighten and even out skin tone. Use in the morning under sunscreen." },
  { store: "glow", category: "personal-care", title: "Sonic Electric Toothbrush with 2-Minute Timer", price: 39.99, compareAt: 49.99, stock: 70, image: "photo-1559591937-abc5678da6ad",
    highlights: ["31,000 strokes/min", "3 modes", "30-day battery", "2 replacement heads"],
    description: "A slim sonic brush with a quad-pacer that tells you when to move on. A month between charges." },
  { store: "glow", category: "personal-care", title: "Ionic Hair Dryer 1800W, Fast-Dry", price: 44.99, compareAt: 64.99, stock: 33, image: "photo-1727364438136-6edc10ef0a52",
    highlights: ["1800 W motor", "Ionic frizz control", "3 heat / 2 speed settings", "Cool-shot button"],
    description: "Dries faster and leaves hair smoother thanks to negative ions. Light enough to hold for a full blow-out." },

  // Pageturner
  { store: "page", category: "books", title: "The Small Habits Handbook (Paperback)", price: 16.99, stock: 120, image: "photo-1610116306796-6fea9f4fae38",
    highlights: ["320 pages", "Paperback", "Includes habit-tracking worksheets"],
    description: "A practical guide to building better routines one tiny change at a time, with worksheets you'll actually fill in." },
  { store: "page", category: "books", title: "Stars Beyond Tau — A Novel (Paperback)", price: 14.99, compareAt: 18.99, stock: 85, image: "photo-1457369804613-52c61a468e7d",
    highlights: ["480 pages", "Science fiction", "Paperback"],
    description: "A lone engineer wakes on a ship with no memory and a failing star outside the window. Clever, funny and impossible to put down." },
  { store: "page", category: "books", title: "Money, Mindset & You (Paperback)", price: 13.99, stock: 95, image: "photo-1604866830893-c13cafa515d5",
    highlights: ["256 pages", "Personal finance", "Paperback"],
    description: "Short, story-driven chapters on why we make the money decisions we do — and how to make better ones." },
  { store: "page", category: "puzzles-board-games", title: "1000-Piece Jigsaw Puzzle, Coastal Town", price: 18.99, stock: 46, image: "photo-1612611741189-a9b9eb01d515",
    highlights: ["1000 precision-cut pieces", "Finished size 70×50 cm", "Recycled board", "Poster included"],
    description: "A detailed coastal scene with satisfying, snug-fitting pieces. A full poster is included for reference." },
  { store: "page", category: "puzzles-board-games", title: "Strategy Board Game for 2–5 Players", price: 44.99, compareAt: 54.99, stock: 21, image: "photo-1676651471150-0e3a5f8de05e",
    highlights: ["2–5 players", "60–90 minutes", "Ages 12+", "Over 200 components"],
    description: "Build, trade and outmanoeuvre your friends across a modular board. Easy to learn, deep enough for game night every week." },
  { store: "page", category: "rc-vehicles", title: "Remote Control Stunt Car, 360° Flips", price: 32.99, compareAt: 44.99, stock: 37, image: "photo-1758964087156-0eac97044f84",
    highlights: ["Double-sided driving", "360° flips", "2.4 GHz remote", "Rechargeable battery"],
    description: "A tough little stunt car that flips, spins and keeps going on either side. Hours of fun on one charge." },
  { store: "page", category: "office", title: "Ergonomic Mesh Office Chair with Lumbar Support", price: 159.99, compareAt: 219.99, stock: 11, image: "photo-1688578735352-9a6f2ac3b70a",
    highlights: ["Adjustable lumbar support", "3D armrests", "Breathable mesh back", "Seat-depth adjustment"],
    description: "A properly adjustable chair for long work days: dial in the lumbar, armrests and seat depth to fit you." },
  { store: "page", category: "office", title: "Standing Desk Converter, 80 cm Wide", price: 124.99, stock: 0, image: "photo-1623177623442-979c1e42c255",
    highlights: ["Gas-spring lift", "Fits two monitors", "Separate keyboard tray", "No assembly"],
    description: "Turns any desk into a standing desk in seconds. Lifts smoothly with a monitor, laptop and keyboard on top." },

  // Peak Form
  { store: "peak", category: "fitness", title: "Extra-Thick Yoga Mat with Two Cork Blocks", price: 27.99, compareAt: 34.99, stock: 66, image: "photo-1646239646963-b0b9be56d6b5",
    highlights: ["8 mm cushioning", "Non-slip on both sides", "2 cork blocks", "Carry strap"],
    description: "Thick enough for knees, firm enough for balance. Comes with two natural cork blocks." },
  { store: "peak", category: "fitness", title: "Rubber Hex Dumbbell Pair, 10 kg", price: 49.99, compareAt: 64.99, stock: 29, image: "photo-1638536532686-d610adfc8e5c",
    highlights: ["Pair of 10 kg", "Rubber-coated heads", "Knurled chrome handles", "Won't roll"],
    description: "Classic hex dumbbells that stay put on the floor. Rubber heads protect your floors and keep the noise down." },
  { store: "peak", category: "fitness", title: "Steel Barbell & Bumper Plate Set, 100 kg", price: 389.99, compareAt: 449.99, stock: 6, image: "photo-1517836357463-d25dfeac3438",
    highlights: ["20 kg, 2.2 m steel bar", "80 kg of bumper plates", "Spring collars included"],
    description: "Everything you need for squats, deadlifts and presses at home. Bumper plates are safe to drop." },
  { store: "peak", category: "hydration", title: "Insulated Steel Water Bottle, 750 ml", price: 21.99, stock: 150, image: "photo-1544003484-3cd181d17917",
    highlights: ["Cold 24 h / hot 12 h", "18/8 stainless steel", "Leak-proof lid", "Fits cup holders"],
    description: "A double-walled bottle that keeps water cold through a full day at the gym or the office." },

  // Flashmart Outlet (suspended store — these listings are hidden from the storefront)
  { store: "flash", category: "phones-wearables", title: "Smart Band Pro Max Ultra (Replica)", price: 9.99, compareAt: 199.99, stock: 500, image: "photo-1523275335684-37898b6baf30",
    highlights: ["Looks just like the real one"], description: "Lowest price anywhere. Ships from overseas." },
];

const REVIEW_LINES: Record<number, string[]> = {
  5: [
    "Exactly as described and arrived two days early. Really happy with it.",
    "Excellent quality for the price. The seller packed it carefully too.",
    "Been using it daily for a few weeks now — no complaints at all.",
    "Better than I expected. Would definitely buy from this store again.",
    "Bought this as a gift and they loved it. Five stars.",
  ],
  4: [
    "Very good overall. Delivery took a little longer than estimated.",
    "Solid product, does what it says. Packaging could be better.",
    "Happy with it. Minor scuff on arrival but works perfectly.",
    "Good value. Instructions were a bit thin but figured it out.",
  ],
  3: [
    "It's okay. Does the job but feels a bit cheaper than the photos.",
    "Average. Not bad, not great — fine for the price.",
  ],
  2: ["Not what I hoped for. The seller was helpful when I asked about it though."],
};
const randomRating = () => {
  const r = rand();
  return r < 0.55 ? 5 : r < 0.85 ? 4 : r < 0.96 ? 3 : 2;
};

async function main() {
  console.log("Clearing tables…");
  await db.execute(sql`truncate table reviews, order_items, sub_orders, orders, product_images, products, categories, stores, users restart identity cascade`);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // --- categories
  const categoryIdBySlug = new Map<string, string>();
  for (const [i, [name, slug, children]] of CATEGORY_TREE.entries()) {
    const [root] = await db.insert(categories).values({ name, slug, sortOrder: i }).returning();
    categoryIdBySlug.set(slug, root.id);
    const rows = await db
      .insert(categories)
      .values(children.map(([cName, cSlug], j) => ({ name: cName, slug: cSlug, parentId: root.id, sortOrder: j })))
      .returning();
    rows.forEach((r) => categoryIdBySlug.set(r.slug, r.id));
  }
  console.log(`  ${categoryIdBySlug.size} categories`);

  // --- users
  await db.insert(users).values({ name: "eBazar Admin", email: "admin@ebazar.test", passwordHash, role: "admin" });
  const customerRows = await db
    .insert(users)
    .values(CUSTOMERS.map(([name, email]) => ({ name, email, passwordHash })))
    .returning();

  // --- stores (role follows store status: only approved stores make a seller)
  const storeIdByKey = new Map<string, string>();
  for (const s of STORES) {
    const wasApproved = s.status === "active" || s.status === "suspended";
    const [owner] = await db
      .insert(users)
      .values({ name: s.owner[0], email: s.owner[1], passwordHash, role: wasApproved ? "seller" : "customer", createdAt: daysAgo(120) })
      .returning();
    const [store] = await db
      .insert(stores)
      .values({
        ownerId: owner.id,
        name: s.name,
        slug: s.slug,
        tagline: s.tagline,
        description: s.description,
        logoUrl: s.logo ?? null,
        bannerUrl: s.banner ?? null,
        status: s.status,
        statusNote: s.statusNote ?? null,
        reviewedAt: s.status === "pending" ? null : daysAgo(90),
        createdAt: s.status === "pending" ? daysAgo(2) : daysAgo(110),
      })
      .returning();
    storeIdByKey.set(s.key, store.id);
  }
  console.log(`  ${STORES.length} stores, ${CUSTOMERS.length} customers, 1 admin`);

  // --- products + images
  const productRows: (typeof products.$inferSelect & { seed: ProductSeed })[] = [];
  for (const p of PRODUCTS) {
    const id = crypto.randomUUID();
    const [row] = await db
      .insert(products)
      .values({
        id,
        storeId: storeIdByKey.get(p.store)!,
        categoryId: categoryIdBySlug.get(p.category)!,
        slug: `${p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)}-${id.slice(0, 6)}`,
        title: p.title,
        description: p.description,
        highlights: p.highlights,
        priceCents: Math.round(p.price * 100),
        compareAtCents: p.compareAt ? Math.round(p.compareAt * 100) : null,
        stock: p.stock,
        status: p.status ?? "active",
        createdAt: daysAgo(30 + Math.floor(rand() * 80)),
      })
      .returning();
    productRows.push({ ...row, seed: p });
  }
  await db.insert(productImages).values(
    productRows.flatMap((p) => gallery(p.seed.image).map((url, position) => ({ productId: p.id, url, position })))
  );
  console.log(`  ${productRows.length} products`);

  // Category tiles use the photo of their first product.
  for (const [slug, id] of categoryIdBySlug) {
    const first = productRows.find((p) => p.seed.category === slug);
    if (first) {
      await db.update(categories).set({ imageUrl: unsplash(first.seed.image, "&w=300&h=300") }).where(sql`${categories.id} = ${id}`);
    }
  }

  // --- order history (only from active stores, never from your own store)
  const buyable = productRows.filter((p) => p.seed.store !== "flash" && p.stock > 0);
  const soldBy = new Map<string, number>();
  const delivered: { userId: string; productId: string; at: Date }[] = [];
  let orderCount = 0;

  for (const customer of customerRows) {
    const isDemoBuyer = customer.email === "buyer@ebazar.test";
    const nOrders = isDemoBuyer ? 4 : 3 + Math.floor(rand() * 4);
    for (let o = 0; o < nOrders; o++) {
      const age = isDemoBuyer ? [40, 12, 4, 1][o] : 2 + Math.floor(rand() * 75);
      const createdAt = daysAgo(age);
      const lines = new Map<string, number>();
      const nLines = 1 + Math.floor(rand() * 3);
      while (lines.size < nLines) lines.set(pick(buyable).id, 1 + Math.floor(rand() * 2));

      const items = [...lines].map(([productId, quantity]) => ({ product: productRows.find((p) => p.id === productId)!, quantity }));
      const byStore = new Map<string, typeof items>();
      items.forEach((it) => byStore.set(it.product.storeId, [...(byStore.get(it.product.storeId) ?? []), it]));

      // Older orders have progressed further through fulfilment.
      const statusFor = (days: number): schema.SubOrderStatus =>
        days > 10 ? "delivered" : days > 5 ? pick(["shipped", "delivered"]) : days > 2 ? pick(["packed", "shipped"]) : "paid";

      const orderId = crypto.randomUUID();
      await db.insert(orders).values({
        id: orderId,
        userId: customer.id,
        status: "paid",
        totalCents: items.reduce((s, it) => s + it.product.priceCents * it.quantity, 0),
        shippingName: customer.name,
        shippingPhone: "+92 300 " + String(1000000 + Math.floor(rand() * 8999999)),
        shippingAddress: { line1: `${10 + Math.floor(rand() * 400)} ${pick(["Canal View", "Garden Town", "Clifton Block 5", "F-7 Markaz", "Model Town"])}`, city: pick(["Lahore", "Karachi", "Islamabad"]), region: "Punjab", postalCode: "54000" },
        paidAt: createdAt,
        createdAt,
      });

      for (const [storeId, group] of byStore) {
        const subId = crypto.randomUUID();
        const status = statusFor(age);
        await db.insert(subOrders).values({
          id: subId,
          orderId,
          storeId,
          status,
          subtotalCents: group.reduce((s, it) => s + it.product.priceCents * it.quantity, 0),
          createdAt,
          updatedAt: createdAt,
        });
        await db.insert(orderItems).values(
          group.map((it) => ({
            subOrderId: subId,
            productId: it.product.id,
            titleSnapshot: it.product.title,
            imageUrlSnapshot: gallery(it.product.seed.image)[0],
            priceCentsSnapshot: it.product.priceCents,
            quantity: it.quantity,
          }))
        );
        for (const it of group) {
          soldBy.set(it.product.id, (soldBy.get(it.product.id) ?? 0) + it.quantity);
          if (status === "delivered") delivered.push({ userId: customer.id, productId: it.product.id, at: createdAt });
        }
      }
      orderCount++;
    }
  }
  console.log(`  ${orderCount} orders`);

  // --- reviews: only for delivered purchases, like the real rule. The demo
  // buyer leaves one product unreviewed so the review form can be shown.
  const seen = new Set<string>();
  const reviewRows = [];
  let leftOneForDemo = false;
  for (const d of delivered) {
    const key = `${d.userId}:${d.productId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const isDemoBuyer = d.userId === customerRows[0].id;
    if (isDemoBuyer && !leftOneForDemo) {
      leftOneForDemo = true;
      continue;
    }
    if (rand() > 0.8) continue;
    const rating = randomRating();
    reviewRows.push({
      productId: d.productId,
      userId: d.userId,
      rating,
      body: pick(REVIEW_LINES[rating]),
      createdAt: new Date(d.at.getTime() + 6 * 86_400_000),
    });
  }
  if (reviewRows.length) await db.insert(reviews).values(reviewRows);

  // --- denormalised counters
  await db.execute(sql`
    update products p set
      review_count = coalesce(r.n, 0),
      rating_avg = coalesce(r.avg, 0)
    from (
      select product_id, count(*)::int as n, round(avg(rating), 1) as avg
      from reviews where hidden = false group by product_id
    ) r
    where r.product_id = p.id
  `);
  for (const [productId, n] of soldBy) {
    await db.update(products).set({ soldCount: n }).where(sql`${products.id} = ${productId}`);
  }
  console.log(`  ${reviewRows.length} reviews`);

  console.log(`\nDone. All demo accounts use the password "${DEMO_PASSWORD}":
  admin@ebazar.test     — site admin
  seller@ebazar.test    — Voltline Electronics (active store)
  buyer@ebazar.test     — customer with order history
  pending@ebazar.test   — store application awaiting approval
  rejected@ebazar.test  — rejected application (can re-apply)
  flashmart@ebazar.test — suspended seller`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
