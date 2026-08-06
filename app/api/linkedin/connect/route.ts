import { NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentSession } from "@/lib/auth";
import { cookies } from "next/headers";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";

// "Sign In with LinkedIn using OpenID Connect" product → openid, profile, email
// "Share on LinkedIn" product → w_member_social
const SCOPES = ["openid", "profile", "email", "w_member_social"];

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", process.env.APP_URL || "http://localhost:3000"));
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "LinkedIn OAuth not configured. Check .env.local" },
      { status: 500 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("li_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: SCOPES.join(" "),
  });

  return NextResponse.redirect(`${LINKEDIN_AUTH_URL}?${params.toString()}`);
}
