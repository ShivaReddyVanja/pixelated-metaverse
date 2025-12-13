import { NextResponse } from "next/server";

export function middleware(req) {
  const ua = req.headers.get("user-agent") || "";
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);

  const url = req.nextUrl.pathname;

  // Do NOT redirect the mobile page itself
  if (url.startsWith("/mobile")) {
    return NextResponse.next();
  }

  if (isMobile) {
    return NextResponse.redirect(new URL("/mobile", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
