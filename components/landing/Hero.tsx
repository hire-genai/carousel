"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-32 px-6">
      {/* Background glow effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute top-40 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] mb-8">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs font-semibold text-white/70 tracking-wide">
            Powered by GPT-4o &amp; Claude Sonnet
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.05] mb-6">
          Turn any idea into a{" "}
          <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            viral LinkedIn
          </span>{" "}
          carousel
        </h1>

        {/* Subheadline */}
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-white/50 leading-relaxed mb-10">
          AI writes it. Canva-style editor designs it. Auto-post to LinkedIn on schedule.
          Everything creators need — in one place.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mb-16">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold shadow-xl shadow-blue-500/25 transition text-sm"
          >
            Get Started Free →
          </Link>
          <Link
            href="/create"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/80 hover:text-white font-semibold transition text-sm"
          >
            Try it now (no signup)
          </Link>
        </div>

        {/* Preview mock */}
        <div className="relative max-w-5xl mx-auto">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/30 to-violet-600/30 blur-3xl opacity-40 rounded-3xl" />
          <div className="relative bg-[#0f0f16]/80 backdrop-blur border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { g: "from-blue-600 to-indigo-700", h: "Stop scrolling.", l: "HOOK" },
                { g: "from-violet-600 to-purple-700", h: "Here's what works.", l: "2" },
                { g: "from-emerald-600 to-teal-700", h: "3 growth hacks.", l: "3" },
                { g: "from-orange-500 to-red-600", h: "What's your take?", l: "CTA" },
              ].map((s, i) => (
                <div
                  key={i}
                  className={`aspect-[4/5] rounded-2xl bg-gradient-to-br ${s.g} p-4 flex flex-col justify-between shadow-lg`}
                >
                  <span className="text-[9px] font-bold uppercase tracking-widest bg-white/20 text-white px-2 py-0.5 rounded-md w-fit">
                    {s.l}
                  </span>
                  <p className="text-white font-bold text-sm leading-tight">{s.h}</p>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((d) => (
                      <div
                        key={d}
                        className={`h-1 flex-1 rounded-full ${d === i ? "bg-white" : "bg-white/20"}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
