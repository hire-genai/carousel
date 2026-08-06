import Link from "next/link";

export default function CTA() {
  return (
    <section className="relative py-24 px-6">
      <div className="max-w-5xl mx-auto relative">
        {/* Glow */}
        <div className="absolute -inset-8 bg-gradient-to-r from-blue-600/30 via-violet-600/30 to-fuchsia-600/30 blur-3xl opacity-50" />

        {/* Card */}
        <div className="relative rounded-3xl bg-gradient-to-br from-blue-600/10 via-violet-600/10 to-fuchsia-600/10 border border-white/10 p-12 sm:p-16 text-center overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
              Ready to grow on{" "}
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                LinkedIn
              </span>
              ?
            </h2>
            <p className="text-white/60 text-lg max-w-xl mx-auto mb-8">
              Join thousands of creators shipping high-quality content, on autopilot.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold shadow-xl shadow-blue-500/25 transition text-sm"
              >
                Get Started Free →
              </Link>
              <Link
                href="#pricing"
                className="px-7 py-3.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/80 hover:text-white font-semibold transition text-sm"
              >
                View pricing
              </Link>
            </div>
            <p className="text-white/30 text-xs mt-6">No credit card required. Free forever plan available.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
