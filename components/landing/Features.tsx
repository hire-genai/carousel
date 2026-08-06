const FEATURES = [
  {
    icon: "✨",
    title: "AI Content Generation",
    desc: "Paste a topic, YouTube link, blog URL, or raw text. AI writes a scroll-stopping carousel in seconds.",
    gradient: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/20",
  },
  {
    icon: "🎨",
    title: "Canva-Style Editor",
    desc: "Full drag-and-drop canvas with text, shapes, images, and layers. Design like a pro, without one.",
    gradient: "from-violet-500/20 to-fuchsia-500/20",
    border: "border-violet-500/20",
  },
  {
    icon: "🚀",
    title: "LinkedIn Auto-Posting",
    desc: "Connect your account once, then publish directly. No more manual PDF uploads or awkward crops.",
    gradient: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/20",
  },
  {
    icon: "⏰",
    title: "Smart Scheduling",
    desc: "Queue posts across time zones. Add delayed auto-comments to boost reach. Set it and forget it.",
    gradient: "from-orange-500/20 to-red-500/20",
    border: "border-orange-500/20",
  },
  {
    icon: "🎯",
    title: "Brand Kit",
    desc: "Logo, colors, fonts locked in. Apply your brand to every slide with one click.",
    gradient: "from-pink-500/20 to-rose-500/20",
    border: "border-pink-500/20",
  },
  {
    icon: "👥",
    title: "Team Collaboration",
    desc: "Draft, review, approve. Roles for editors, managers, and clients. Ship faster together.",
    gradient: "from-amber-500/20 to-yellow-500/20",
    border: "border-amber-500/20",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 mb-3">Features</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Everything you need to <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              win LinkedIn
            </span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            From idea to viral post — every step handled by AI or your team, never a spreadsheet.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`group relative overflow-hidden bg-white/[0.03] border ${f.border} rounded-2xl p-6 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1`}
            >
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-2xl mb-4 border ${f.border}`}
              >
                {f.icon}
              </div>

              <h3 className="text-white font-bold text-lg mb-2 tracking-tight">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>

              {/* Glow effect on hover */}
              <div className={`absolute -inset-1 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 -z-10 blur-2xl transition-opacity duration-300`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
