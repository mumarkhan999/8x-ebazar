import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { CartProvider } from "@/lib/cart-context";
import { NavigationProgress } from "@/components/navigation-progress";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "eBazar — a marketplace of independent stores",
    template: "%s · eBazar",
  },
  description:
    "eBazar is a multi-vendor marketplace: independent sellers open a stall, shoppers buy from many stores in one checkout.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
