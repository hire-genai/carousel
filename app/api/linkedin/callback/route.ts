import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";

function redirectWithError(base: string, code: string) {
  const url = new URL("/dashboard/settings", base);
  url.searchParams.set("linkedin_error", code);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const session = await getCurrentSession();
  if (!session) return NextResponse.redirect(new URL("/login", appUrl));

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errParam = url.searchParams.get("error");

  if (errParam) return redirectWithError(appUrl, errParam);
  if (!code || !state) return redirectWithError(appUrl, "missing_params");

  const cookieStore = await cookies();
  const savedState = cookieStore.get("li_oauth_state")?.value;
  cookieStore.delete("li_oauth_state");

  if (!savedState || savedState !== state) {
    return redirectWithError(appUrl, "state_mismatch");
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID!;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET!;
  const redirectUri = process.env.LINKEDIN_REDIRECT_URI!;

  // Exchange code for token
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    console.error("[linkedin/callback] token exchange failed:", text);
    return redirectWithError(appUrl, "token_exchange_failed");
  }

  const tokenData = await tokenRes.json();
  const accessToken: string = tokenData.access_token;
  const refreshToken: string | undefined = tokenData.refresh_token;
  const expiresIn: number = tokenData.expires_in ?? 5184000;
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  const authHeader = { Authorization: `Bearer ${accessToken}` };

  let linkedinId: string | null = null;
  let displayName: string | null = null;
  let profileEmail: string | null = null;

  // Strategy 1: OpenID Connect /userinfo (requires "Sign In with LinkedIn using OpenID Connect" product)
  try {
    const uiRes = await fetch("https://api.linkedin.com/v2/userinfo", { headers: authHeader });
    if (uiRes.ok) {
      const ui = await uiRes.json();
      linkedinId = ui.sub ?? null;
      displayName = ui.name || [ui.given_name, ui.family_name].filter(Boolean).join(" ") || null;
      profileEmail = ui.email ?? null;
    }
  } catch { /* fall through */ }

  // Strategy 2: Legacy /v2/me (works with r_liteprofile, and often with w_member_social alone)
  if (!linkedinId) {
    try {
      const meRes = await fetch(
        "https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName)",
        { headers: authHeader }
      );
      if (meRes.ok) {
        const me = await meRes.json();
        linkedinId = me.id ?? null;
        if (linkedinId) {
          const first: string = me.localizedFirstName ?? "";
          const last: string = me.localizedLastName ?? "";
          displayName = [first, last].filter(Boolean).join(" ") || null;
        }
      } else {
        const errBody = await meRes.text();
        console.warn("[linkedin/callback] /v2/me status:", meRes.status, errBody);
      }
    } catch (e) {
      console.warn("[linkedin/callback] /v2/me threw:", e);
    }
  }

  // If we still don't have the member ID, we cannot post — direct user to add the product
  if (!linkedinId) {
    return redirectWithError(appUrl, "need_profile_product");
  }

  const linkedinUrn = `urn:li:person:${linkedinId}`;

  await prisma.linkedInAccount.upsert({
    where: { userId: session.userId },
    update: {
      linkedinUrn,
      displayName,
      profileEmail,
      accessToken,
      refreshToken: refreshToken ?? null,
      expiresAt,
      connectedAt: new Date(),
    },
    create: {
      userId: session.userId,
      linkedinUrn,
      displayName,
      profileEmail,
      accessToken,
      refreshToken: refreshToken ?? null,
      expiresAt,
    },
  });

  return NextResponse.redirect(new URL("/dashboard/settings?linkedin=connected", appUrl));
}
