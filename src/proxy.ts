import { NextResponse } from "next/server";
import { auth } from "@/auth";

const protectedPrefixes = ["/checkout", "/orders", "/account"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/checkout/:path*", "/orders/:path*", "/account/:path*"],
};
