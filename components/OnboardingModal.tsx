"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "onboarding_done";
const TOTAL_STEPS = 5;

// ─── Step sub-components ────────────────────────────────────────────────────

function StepWelcome({
  onTour,
  onSkip,
}: {
  onTour: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center flex-1 justify-center gap-6">
      <div className="text-5xl select-none">🎉</div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Welcome to SkygenAI
        </h2>
        <p className="text-white/60 text-base leading-relaxed">
          Turn any idea into a LinkedIn carousel in 60 seconds
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          onClick={onTour}
          className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          Quick Tour (2 min)
        </button>
        <button
          onClick={onSkip}
          className="flex-1 px-5 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium rounded-xl border border-white/10 transition-all"
        >
          Skip, jump in
        </button>
      </div>
    </div>
  );
}

function StepCreate() {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div>
        <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-1">
          Step 1 of 3
        </p>
        <h2 className="text-xl font-bold text-white">Generate a Carousel</h2>
        <p className="text-white/50 text-sm mt-1 leading-relaxed">
          Drop a topic, YouTube link, blog URL, or paste text. AI writes your
          slides.
        </p>
      </div>

      {/* Mock input */}
      <div className="rounded-xl bg-[#0f0f13] border border-white/10 px-4 py-3 flex items-center gap-3">
        <span className="text-white/30 text-sm flex-1 truncate">
          e.g. &quot;5 habits of top LinkedIn creators&quot;
        </span>
        <span className="shrink-0 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold">
          Generate
        </span>
      </div>

      {/* Animation placeholder */}
      <div className="flex-1 rounded-xl bg-[#0f0f13] border border-dashed border-white/10 flex flex-col items-center justify-center gap-3 py-8 min-h-[100px]">
        <div className="text-3xl animate-bounce select-none">✨</div>
        <p className="text-white/40 text-sm font-medium">AI Writing...</p>
        <div className="flex gap-1.5 mt-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StepEdit() {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div>
        <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-1">
          Step 2 of 3
        </p>
        <h2 className="text-xl font-bold text-white">Edit &amp; Design</h2>
        <p className="text-white/50 text-sm mt-1 leading-relaxed">
          Click any text to edit inline. Customize backgrounds, fonts, and
          layouts.
        </p>
      </div>

      {/* Mini slide mockup */}
      <div className="flex-1 rounded-xl bg-gradient-to-br from-blue-900/30 to-violet-900/30 border border-white/10 p-5 flex flex-col gap-3 min-h-[140px]">
        {/* Simulated text lines */}
        <div className="h-3.5 w-2/3 bg-white/25 rounded-lg animate-pulse" />
        <div className="h-2.5 w-full bg-white/10 rounded-lg" />
        <div className="h-2.5 w-5/6 bg-white/10 rounded-lg" />
        <div className="h-2.5 w-4/6 bg-white/10 rounded-lg" />

        {/* Design controls hint */}
        <div className="mt-auto flex items-center gap-2 pt-2 border-t border-white/5">
          <div className="flex gap-1.5">
            {["bg-blue-500", "bg-violet-500", "bg-pink-500", "bg-orange-400"].map(
              (c, i) => (
                <div key={i} className={`w-3 h-3 rounded-full ${c} shadow`} />
              )
            )}
          </div>
          <span className="text-white/30 text-xs ml-auto tracking-wide">
            Aa&nbsp;&nbsp;/&nbsp;&nbsp;Bg
          </span>
        </div>
      </div>

      <p className="text-white/35 text-xs">
        Click any element on the canvas to select and edit it directly.
      </p>
    </div>
  );
}

function StepExport() {
  const actions = [
    { icon: "🖼️", label: "PNG", desc: "High-quality images" },
    { icon: "📄", label: "PDF", desc: "Print-ready format" },
    { icon: "🔗", label: "LinkedIn", desc: "Post directly" },
  ];

  return (
    <div className="flex flex-col gap-4 flex-1">
      <div>
        <p className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-1">
          Step 3 of 3
        </p>
        <h2 className="text-xl font-bold text-white">Export &amp; Post</h2>
        <p className="text-white/50 text-sm mt-1 leading-relaxed">
          Download as PNG, PDF, or post directly to LinkedIn.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 flex-1">
        {actions.map((a) => (
          <div
            key={a.label}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#0f0f13] border border-white/10 text-center"
          >
            <span className="text-2xl select-none">{a.icon}</span>
            <span className="text-white font-semibold text-sm">{a.label}</span>
            <span className="text-white/40 text-xs leading-tight">{a.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepDone({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex flex-col items-center text-center flex-1 justify-center gap-6">
      <div className="text-5xl select-none">🚀</div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          You&apos;re all set!
        </h2>
        <p className="text-white/60 text-base leading-relaxed">
          Everything you need to build an audience on LinkedIn — in one tool.
        </p>
      </div>
      <button
        onClick={onDone}
        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/20"
      >
        Go create your first carousel →
      </button>
    </div>
  );
}

// ─── Main modal ─────────────────────────────────────────────────────────────

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, []);

  function complete() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function handleDone() {
    complete();
    router.push("/dashboard/templates");
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#16161e] rounded-3xl shadow-2xl border border-white/[0.08] overflow-hidden">
        {/* Skip button — hidden on final Done step */}
        {step < 4 && (
          <button
            onClick={complete}
            aria-label="Skip onboarding"
            className="absolute top-5 right-5 text-xs text-white/30 hover:text-white/70 transition z-10 flex items-center gap-1"
          >
            Skip <span className="text-[10px]">✕</span>
          </button>
        )}

        {/* Step progress dots */}
        <div className="flex items-center justify-center gap-1.5 pt-6 px-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-7 bg-blue-500"
                  : i < step
                  ? "w-1.5 bg-blue-400/50"
                  : "w-1.5 bg-white/15"
              }`}
            />
          ))}
        </div>

        {/* Step content area */}
        <div className="px-8 py-6 min-h-[300px] flex flex-col">
          {step === 0 && (
            <StepWelcome onTour={() => setStep(1)} onSkip={complete} />
          )}
          {step === 1 && <StepCreate />}
          {step === 2 && <StepEdit />}
          {step === 3 && <StepExport />}
          {step === 4 && <StepDone onDone={handleDone} />}
        </div>

        {/* Bottom navigation — steps 1-3 */}
        {step >= 1 && step <= 3 && (
          <div className="flex justify-between items-center px-8 pb-7 pt-1">
            <button
              onClick={() => setStep((s) => s - 1)}
              className="text-sm text-white/40 hover:text-white/80 transition"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep((s) => s + 1)}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition"
            >
              Next →
            </button>
          </div>
        )}

        {/* Bottom navigation — Done step (only Back) */}
        {step === 4 && (
          <div className="flex items-center px-8 pb-7 pt-1">
            <button
              onClick={() => setStep((s) => s - 1)}
              className="text-sm text-white/40 hover:text-white/80 transition"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
