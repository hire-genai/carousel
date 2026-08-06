import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PATHS = ["/dashboard", "/create"];
const AUTH_PATHS = ["/login", "/signup"];
const SESSION_COOKIE = "skygen_session";

async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.JWT_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const authed = await isValidSession(token);

  // Redirect logged-in users away from login/signup
  if (authed && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect anonymous users away from protected routes
  if (!authed && PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/create/:path*", "/login", "/signup"],
};
