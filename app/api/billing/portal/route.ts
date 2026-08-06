import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Dev/demo mode when placeholder key is present
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith("sk_test_placeholder")) {
      return NextResponse.json({ url: "/dashboard/billing?demo=1" });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer found for this account" },
        { status: 400 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-06-24.dahlia",
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${baseUrl}/dashboard/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err) {
    console.error("[billing/portal] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
