"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Plan = "free" | "pro" | "business";

interface Props {
  currentPlan: Plan;
  hasStripeCustomer: boolean;
  searchParams: { success?: string; canceled?: string; demo?: string };
}

const PLANS: {
  id: Plan;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
}[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "Get started with the basics",
    features: [
      "5 carousels per month",
      "Basic templates",
      "PNG export",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    period: "/mo",
    description: "Everything you need to grow",
    features: [
      "Unlimited carousels",
      "All templates",
      "PNG + PDF export",
      "LinkedIn direct posting",
      "Post scheduling",
      "Priority email support",
    ],
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    price: "$49",
    period: "/mo",
    description: "Built for teams and agencies",
    features: [
      "Everything in Pro",
      "Up to 10 team members",
      "Brand kit",
      "Priority support",
      "Custom templates",
      "Analytics dashboard",
    ],
  },
];

const FAQ = [
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes. You can cancel anytime from the Billing Portal. You'll keep access until the end of your current billing period — no prorated refunds, no hidden fees.",
  },
  {
    q: "Will I be charged immediately when I upgrade?",
    a: "Yes, upgrading charges you immediately for the new plan. If you upgrade mid-cycle, Stripe prorates the difference automatically.",
  },
  {
    q: "What happens to my carousels if I downgrade to Free?",
    a: "Your existing carousels are safe. However, you'll be limited to 5 new carousels per month and lose access to premium templates and PDF export.",
  },
];

export default function BillingPage({ currentPlan, hasStripeCustomer, searchParams }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<Plan | "portal" | null>(null);

  async function handleUpgrade(plan: Plan) {
    setLoading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No URL in checkout response", data);
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Portal error:", err);
    } finally {
      setLoading(null);
    }
  }

  const isPaid = currentPlan === "pro" || currentPlan === "business";

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-[11px] text-white/30 uppercase tracking-widest font-medium mb-1">
          Billing
        </p>
        <h1 className="text-3xl font-black tracking-tight">Plans &amp; Pricing</h1>
        <p className="text-white/40 text-sm mt-1">
          Choose the plan that fits your workflow
        </p>
      </div>

      {/* Test-mode warning */}
      <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3">
        <span className="mt-0.5 text-amber-400 text-base">⚠</span>
        <p className="text-amber-300 text-sm">
          <strong className="font-semibold">Stripe test mode active.</strong> Use card{" "}
          <code className="font-mono bg-white/10 px-1 py-0.5 rounded text-xs">4242 4242 4242 4242</code>{" "}
          with any future expiry and CVC to test payments. No real charges will occur.
        </p>
      </div>

      {/* Success / canceled banners */}
      {searchParams.success === "1" && (
        <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-green-300 text-sm">
          ✓ Your subscription has been activated. Welcome to {currentPlan === "pro" ? "Pro" : "Business"}!
        </div>
      )}
      {searchParams.canceled === "1" && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-red-300 text-sm">
          ✗ Checkout was canceled. No changes were made.
        </div>
      )}
      {searchParams.demo === "1" && (
        <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-blue-300 text-sm">
          ℹ Demo mode — Stripe keys are placeholders. Configure real keys in .env.local to enable live checkout.
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isPro = plan.id === "pro";

          return (
            <div
              key={plan.id}
              className={[
                "relative flex flex-col rounded-2xl border p-6 transition-all",
                isPro
                  ? "border-violet-500/60 bg-violet-500/5 shadow-[0_0_40px_-8px_rgba(139,92,246,0.35)]"
                  : "border-white/10 bg-white/[0.03]",
              ].join(" ")}
            >
              {/* Popular badge */}
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-violet-500 px-3 py-0.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current plan indicator */}
              {isCurrent && (
                <div className="absolute top-4 right-4">
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/60">
                    Current
                  </span>
                </div>
              )}

              {/* Plan name & price */}
              <div className="mb-4">
                <h2 className="text-lg font-bold text-white mb-1">{plan.name}</h2>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-white/40 text-sm mb-1">{plan.period}</span>
                </div>
                <p className="text-white/40 text-xs mt-1">{plan.description}</p>
              </div>

              {/* Feature list */}
              <ul className="flex-1 space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="mt-0.5 text-violet-400 font-bold">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <button
                  disabled
                  className="w-full rounded-xl py-2.5 text-sm font-semibold bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
                >
                  Current Plan
                </button>
              ) : plan.id === "free" ? (
                <button
                  disabled
                  className="w-full rounded-xl py-2.5 text-sm font-semibold bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
                >
                  Free Forever
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading === plan.id}
                  className={[
                    "w-full rounded-xl py-2.5 text-sm font-semibold transition-all",
                    isPro
                      ? "bg-violet-500 hover:bg-violet-400 text-white disabled:opacity-60"
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/10 disabled:opacity-60",
                  ].join(" ")}
                >
                  {loading === plan.id ? "Loading…" : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Manage Billing button (for paid users) */}
      {isPaid && (
        <div className="mb-12 rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-white font-semibold text-base mb-0.5">Manage your subscription</h3>
            <p className="text-white/40 text-sm">
              Update payment method, view invoices, or cancel your plan via the Stripe Billing Portal.
            </p>
          </div>
          <button
            onClick={handlePortal}
            disabled={loading === "portal"}
            className="shrink-0 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
          >
            {loading === "portal" ? "Loading…" : "Manage Billing →"}
          </button>
        </div>
      )}

      {/* FAQ */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-white hover:bg-white/[0.03] transition-colors"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <span
          className={[
            "ml-4 text-white/40 transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        >
          ▾
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-white/50 leading-relaxed border-t border-white/[0.06] pt-3">
          {a}
        </div>
      )}
    </div>
  );
}
