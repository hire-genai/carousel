const TESTIMONIALS = [
  {
    quote: "I went from spending 2 hours per carousel to 5 minutes. My engagement doubled in the first week.",
    name: "Priya Sharma",
    role: "Growth Marketer",
    avatar: "PS",
    accent: "from-blue-500 to-violet-500",
  },
  {
    quote: "The AI actually gets my voice. It's the first tool that doesn't feel like a generic content mill.",
    name: "Marcus Chen",
    role: "Startup Founder",
    avatar: "MC",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    quote: "Scheduling + auto-comments is a game-changer. My reach 3x'd without me doing any extra work.",
    name: "Sarah Williams",
    role: "LinkedIn Coach",
    avatar: "SW",
    accent: "from-pink-500 to-rose-500",
  },
  {
    quote: "Client approvals used to take days. Now they review, comment, and approve inside the app in minutes.",
    name: "David Kumar",
    role: "Agency Owner",
    avatar: "DK",
    accent: "from-orange-500 to-red-500",
  },
  {
    quote: "The editor is genuinely on par with Canva but tailored for LinkedIn carousels. Chef's kiss.",
    name: "Emma Rodriguez",
    role: "Content Creator",
    avatar: "ER",
    accent: "from-cyan-500 to-blue-500",
  },
  {
    quote: "Built our entire LinkedIn strategy on this. Team of 4, publishes 20 posts a week. It just works.",
    name: "James Patel",
    role: "Head of Marketing",
    avatar: "JP",
    accent: "from-fuchsia-500 to-pink-500",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-fuchsia-400 mb-3">Testimonials</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Loved by <span className="bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent">10,000+ creators</span>
          </h2>
          <p className="text-white/50 text-lg">Real reviews from real users shipping real content.</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] transition"
            >
              {/* Quote */}
              <p className="text-white/80 text-[15px] leading-relaxed mb-5">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.accent} flex items-center justify-center text-white font-bold text-sm shadow-lg`}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-white/40 text-xs">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { n: "10K+", l: "Active users" },
            { n: "500K+", l: "Carousels created" },
            { n: "2M+", l: "Posts published" },
            { n: "4.9★", l: "Average rating" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="text-3xl font-black bg-gradient-to-br from-blue-400 to-violet-400 bg-clip-text text-transparent">
                {s.n}
              </p>
              <p className="text-white/40 text-xs uppercase tracking-widest mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
