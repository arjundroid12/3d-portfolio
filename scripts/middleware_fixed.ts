import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// Custom middleware: API routes get 401 JSON, pages get redirected to signin
export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;

  if (isAuthenticated) {
    return NextResponse.next();
  }

  // Not authenticated — check if it's an API route
  if (req.nextUrl.pathname.startsWith("/api/")) {
    // Return JSON 401 for API routes (no redirect — frontend handles it)
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Page route — redirect to signin with callbackUrl = the page URL (not API URL)
  const signInUrl = new URL("/signin", req.nextUrl.origin);
  signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/app/:path*", "/api/scripts/:path*", "/api/ideas/:path*", "/api/thumbnails/:path*"],
};
