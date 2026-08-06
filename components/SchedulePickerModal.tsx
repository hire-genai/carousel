"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface CarouselItem {
  id: string;
  title: string;
  slideCount: number;
  createdAt: string;
}

interface Props {
  onClose: () => void;
  preselectedId?: string;
  preselectedTitle?: string;
}

export default function SchedulePickerModal({ onClose, preselectedId, preselectedTitle }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"pick" | "time">(preselectedId ? "time" : "pick");
  const [carousels, setCarousels] = useState<CarouselItem[]>([]);
  const [loadingList, setLoadingList] = useState(!preselectedId);
  const [selected, setSelected] = useState<{ id: string; title: string } | null>(
    preselectedId ? { id: preselectedId, title: preselectedTitle ?? "" } : null
  );
  const [search, setSearch] = useState("");

  // Step 2 fields
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [date, setDate] = useState(tomorrow.toISOString().slice(0, 10));
  const [time, setTime] = useState("09:00");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const minDate = new Date();
  minDate.setMinutes(minDate.getMinutes() + 5);
  const minDateStr = minDate.toISOString().slice(0, 10);

  useEffect(() => {
    if (preselectedId) return;
    fetch("/api/carousels")
      .then((r) => r.json())
      .then((d) => setCarousels(d.carousels ?? []))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, [preselectedId]);

  const filtered = carousels.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  function pickCarousel(c: CarouselItem) {
    setSelected({ id: c.id, title: c.title });
    setStep("time");
  }

  async function handleSchedule() {
    if (!selected || !date || !time) return;
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
    if (new Date(scheduledAt) <= new Date()) {
      setError("Scheduled time must be in the future.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carouselId: selected.id,
          scheduledAt,
          autoComment: comment || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to schedule.");
      setDone(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#16161e] border border-white/10 rounded-3xl w-full shadow-2xl overflow-hidden"
        style={{ maxWidth: step === "pick" ? "560px" : "440px" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            {step === "time" && !preselectedId && (
              <button
                onClick={() => { setStep("pick"); setSelected(null); setError(""); }}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition flex items-center justify-center text-sm"
              >←</button>
            )}
            <div>
              <h2 className="text-lg font-black text-white">
                {done ? "Scheduled!" : step === "pick" ? "Pick a Carousel" : "Set Date & Time"}
              </h2>
              {selected && step === "time" && !done && (
                <p className="text-white/40 text-xs mt-0.5 truncate max-w-[280px]">{selected.title}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition flex items-center justify-center"
          >✕</button>
        </div>

        {/* Step indicator */}
        {!done && !preselectedId && (
          <div className="flex px-7 pt-4 gap-2">
            {(["pick", "time"] as const).map((s, i) => (
              <div key={s} className={`flex items-center gap-2 text-xs font-semibold ${step === s ? "text-white" : "text-white/25"}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition ${step === s ? "bg-blue-600 text-white" : i === 0 && step === "time" ? "bg-white/20 text-white/60" : "bg-white/[0.06] text-white/25"}`}>
                  {i === 0 && step === "time" ? "✓" : i + 1}
                </div>
                {s === "pick" ? "Choose Carousel" : "Schedule Time"}
                {i === 0 && <div className="w-6 h-px bg-white/10" />}
              </div>
            ))}
          </div>
        )}

        <div className="p-7">
          {/* ── STEP 1: Carousel Picker ── */}
          {step === "pick" && (
            <div className="space-y-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search carousels..."
                className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
              />

              {loadingList ? (
                <div className="flex items-center justify-center py-10 gap-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-white/30 text-sm">
                    {search ? "No carousels match your search" : "No saved carousels yet"}
                  </p>
                  {!search && (
                    <a href="/dashboard/templates" className="mt-3 inline-block text-blue-400 text-sm hover:text-blue-300 transition">
                      Create one first →
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-none">
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => pickCarousel(c)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.07] hover:border-blue-500/30 transition text-left group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/[0.08] flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-105 transition-transform">
                        🎯
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{c.title}</p>
                        <p className="text-white/35 text-xs mt-0.5">
                          {c.slideCount} slides &middot;{" "}
                          {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <span className="text-white/20 group-hover:text-blue-400 text-sm transition">→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Date/Time Picker ── */}
          {step === "time" && !done && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold block mb-2">Date</label>
                  <input
                    type="date"
                    value={date}
                    min={minDateStr}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold block mb-2">Time</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold block mb-2">
                  Auto-comment <span className="normal-case text-white/20">(optional — posted right after)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a first comment to boost reach... (e.g. Full breakdown in the thread below 👇)"
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">⚠️ {error}</div>
              )}

              <button
                onClick={handleSchedule}
                disabled={submitting || !date}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-sm transition shadow-lg shadow-blue-500/20 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Scheduling...
                  </>
                ) : "⏰ Schedule Post"}
              </button>

              <p className="text-center text-white/20 text-[11px]">Timezone: your local browser time</p>
            </div>
          )}

          {/* ── Success ── */}
          {done && (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-lg font-bold text-white mb-2">Scheduled!</h3>
              <p className="text-white/40 text-sm mb-6">
                <span className="text-white font-semibold">{selected?.title}</span> will post on{" "}
                {new Date(`${date}T${time}`).toLocaleString("en-US", {
                  weekday: "long", month: "long", day: "numeric",
                  hour: "numeric", minute: "2-digit",
                })}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white text-sm font-semibold transition"
                >
                  Done
                </button>
                <a
                  href="/dashboard/scheduled"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold text-center transition"
                >
                  View Scheduled →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
