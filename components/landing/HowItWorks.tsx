const STEPS = [
  {
    num: "01",
    title: "Paste your idea",
    desc: "A topic, a YouTube link, a blog URL, or raw text. Anything works as a starting point.",
    accent: "from-blue-500 to-cyan-500",
  },
  {
    num: "02",
    title: "AI writes the slides",
    desc: "Claude crafts a scroll-stopping hook, insight-packed middle slides, and a strong CTA.",
    accent: "from-violet-500 to-purple-500",
  },
  {
    num: "03",
    title: "Design in one click",
    desc: "Pick a template, tweak colors, drop in your brand. Or fine-tune every pixel yourself.",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    num: "04",
    title: "Publish or schedule",
    desc: "One click to publish. Or queue it for the perfect posting time — no manual export needed.",
    accent: "from-orange-500 to-red-500",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="relative py-24 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400 mb-3">How it works</p>
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
            From blank page to <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">published post</span>
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">Four simple steps. Less than 5 minutes.</p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-14 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {STEPS.map((s) => (
            <div key={s.num} className="relative">
              {/* Number circle */}
              <div className="relative z-10 mb-6 flex justify-center">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.accent} flex items-center justify-center font-black text-white text-lg shadow-xl`}
                >
                  {s.num}
                </div>
              </div>

              {/* Text */}
              <div className="text-center">
                <h3 className="text-white font-bold text-lg mb-2 tracking-tight">{s.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
