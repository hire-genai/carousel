"use client";

import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "0",
    period: "forever",
    tagline: "Perfect for trying it out",
    cta: "Start Free",
    highlight: false,
    features: [
      { text: "5 AI-generated carousels / month", included: true },
      { text: "3 basic templates", included: true },
      { text: "PDF & PNG export", included: true },
      { text: "LinkedIn auto-posting", included: false },
      { text: "Post scheduling", included: false },
      { text: "Brand kit", included: false },
      { text: "Team collaboration", included: false },
    ],
  },
  {
    name: "Pro",
    price: "19",
    period: "/mo",
    tagline: "For serious creators",
    cta: "Start Pro Trial",
    highlight: true,
    badge: "Most Popular",
    features: [
      { text: "Unlimited AI generations", included: true },
      { text: "20+ premium templates", included: true },
      { text: "PDF, PNG & GIF export", included: true },
      { text: "LinkedIn auto-posting", included: true },
      { text: "Post scheduling + queue", included: true },
      { text: "Full brand kit", included: true },
      { text: "Team collaboration", included: false },
    ],
  },
  {
    name: "Business",
    price: "49",
    period: "/mo",
    tagline: "For teams & agencies",
    cta: "Contact Sales",
    highlight: false,
    features: [
      { text: "Everything in Pro", included: true },
      { text: "5 workspace seats", included: true },
      { text: "Approval workflow", included: true },
      { text: "Client review mode", included: true },
      { text: "Priority support", included: true },
      { text: "Analytics dashboard", included: true },
      { text: "Custom integrations", included: true },
    ],
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 mb-3">Pricing</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Simple, honest{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              pricing
            </span>
          </h2>
          <p className="text-white/50 text-lg">Start free. Upgrade when you&apos;re ready.</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl p-8 ${
                p.highlight
                  ? "bg-gradient-to-b from-blue-500/10 to-violet-500/10 border-2 border-blue-500/40 shadow-2xl shadow-blue-500/20 scale-[1.02]"
                  : "bg-white/[0.03] border border-white/10"
              }`}
            >
              {/* Badge */}
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-blue-500 to-violet-500 text-white">
                    {p.badge}
                  </span>
                </div>
              )}

              {/* Name */}
              <h3 className="text-white font-bold text-lg mb-1">{p.name}</h3>
              <p className="text-white/40 text-sm mb-6">{p.tagline}</p>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black text-white">${p.price}</span>
                <span className="text-white/40 text-sm">{p.period}</span>
              </div>

              {/* CTA */}
              <Link
                href={p.name === "Business" ? "mailto:hello@skygenai.app" : "/signup"}
                className={`block text-center w-full py-2.5 rounded-xl font-semibold text-sm mb-8 transition ${
                  p.highlight
                    ? "bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white shadow-lg shadow-blue-500/20"
                    : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                }`}
              >
                {p.cta}
              </Link>

              {/* Features */}
              <ul className="space-y-3">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span
                      className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                        f.included
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-white/5 text-white/20"
                      }`}
                    >
                      {f.included ? "✓" : "×"}
                    </span>
                    <span className={f.included ? "text-white/70" : "text-white/25 line-through"}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-white/30 text-xs mt-10">
          All plans include a 14-day money-back guarantee. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
