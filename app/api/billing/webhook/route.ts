export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

function planFromPriceId(priceId: string | null | undefined): string {
  if (!priceId) return "free";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_BUSINESS) return "business";
  return "free";
}

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
    apiVersion: "2026-06-24.dahlia",
  });
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[billing/webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan ?? "free";

        if (!userId) break;

        const subId = session.subscription as string | null;
        let periodEnd: Date | undefined;
        let stripePriceId: string | undefined;

        if (subId) {
          const raw = await stripe.subscriptions.retrieve(subId) as unknown as Record<string, unknown>;
          const ts = raw.current_period_end as number | undefined;
          periodEnd = ts ? new Date(ts * 1000) : undefined;
          const items = raw.items as { data: Array<{ price: { id: string } }> } | undefined;
          stripePriceId = items?.data[0]?.price.id;
        }

        await prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            plan,
            status: "active",
            stripeCustomerId: session.customer as string,
            stripePriceId: stripePriceId ?? null,
            stripeSubId: subId ?? null,
            periodEnd: periodEnd ?? null,
          },
          update: {
            plan,
            status: "active",
            stripeCustomerId: session.customer as string,
            stripePriceId: stripePriceId ?? null,
            stripeSubId: subId ?? null,
            periodEnd: periodEnd ?? null,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const raw2 = event.data.object as unknown as Record<string, unknown>;
        const items2 = raw2.items as { data: Array<{ price: { id: string } }> } | undefined;
        const priceId = items2?.data[0]?.price.id;
        const plan = planFromPriceId(priceId);
        const ts2 = raw2.current_period_end as number | undefined;
        const periodEnd = ts2 ? new Date(ts2 * 1000) : null;
        const subStatus = raw2.status as string | undefined;
        const status = subStatus === "active" || subStatus === "trialing" ? "active" : (subStatus ?? "unknown");

        const subId2 = raw2.id as string | undefined;
        await prisma.subscription.updateMany({
          where: { stripeSubId: subId2 },
          data: {
            plan,
            status,
            stripePriceId: priceId ?? null,
            periodEnd,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const rawDel = event.data.object as unknown as { id: string };

        await prisma.subscription.updateMany({
          where: { stripeSubId: rawDel.id },
          data: {
            plan: "free",
            status: "canceled",
            stripePriceId: null,
            stripeSubId: null,
            periodEnd: null,
          },
        });
        break;
      }

      default:
        // Unhandled event — ignore
        break;
    }
  } catch (err) {
    console.error("[billing/webhook] handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
