import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Optimistic check only: is there a session at all? Role checks (seller,
// admin) happen in the data access layer (src/lib/dal.ts) against the DB,
// because the JWT doesn't carry the role.
export default auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: [
    "/checkout/:path*",
    "/account/:path*",
    "/sell/:path*",
    "/seller/:path*",
    "/admin/:path*",
  ],
};
