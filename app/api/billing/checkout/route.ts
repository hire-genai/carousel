import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PRICE_MAP: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRICE_PRO,
  business: process.env.STRIPE_PRICE_BUSINESS,
};

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { plan } = body as { plan: "pro" | "business" };

    if (!plan || !["pro", "business"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Dev/demo mode when placeholder key is present
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith("sk_test_placeholder")) {
      return NextResponse.json({ url: "/dashboard/billing?demo=1" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-06-24.dahlia",
    });

    const priceId = PRICE_MAP[plan];
    if (!priceId) {
      return NextResponse.json({ error: "Price not configured" }, { status: 500 });
    }

    // Get or create Stripe customer
    let subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    let stripeCustomerId = subscription?.stripeCustomerId ?? null;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;

      // Upsert subscription record with the new customer id
      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          plan: "free",
          status: "active",
          stripeCustomerId,
        },
        update: { stripeCustomerId },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard/billing?success=1`,
      cancel_url: `${baseUrl}/dashboard/billing?canceled=1`,
      metadata: { userId: user.id, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[billing/checkout] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
