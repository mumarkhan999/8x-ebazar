import Link from "next/link";
import { LogoMark } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-ink text-white/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-white">
            <LogoMark />
            <span className="text-lg font-extrabold">eBazar</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-6">
            A marketplace of independent stores. Every seller is reviewed by our team before their first listing goes
            live.
          </p>
        </div>
        <FooterCol
          title="Shop"
          links={[
            ["/deals", "Today's deals"],
            ["/stores", "Browse stores"],
            ["/search?sort=popular", "Best sellers"],
            ["/search?sort=newest", "New arrivals"],
          ]}
        />
        <FooterCol
          title="Sell"
          links={[
            ["/sell", "Open a store"],
            ["/seller", "Seller Center"],
            ["/seller/products/new", "List a product"],
          ]}
        />
        <FooterCol
          title="Your account"
          links={[
            ["/account/orders", "Orders & tracking"],
            ["/account", "Account details"],
            ["/cart", "Cart"],
          ]}
        />
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-white/50">
          eBazar is a demo project built for a take-home assignment. Payments run in Stripe test mode — no real
          charges are made. Product photos from Unsplash.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
