"use client";

import { useState } from "react";

interface Props {
  carouselId: string;
  title: string;
  linkedinConnected: boolean;
  onClose: () => void;
  onScheduled?: () => void;
}

export default function ScheduleModal({ carouselId, title, linkedinConnected, onClose, onScheduled }: Props) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const minDate = new Date();
  minDate.setMinutes(minDate.getMinutes() + 5);
  const minDateStr = minDate.toISOString().slice(0, 10);

  async function handleSchedule() {
    if (!date || !time) { setError("Please select a date and time."); return; }
    const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
    if (new Date(scheduledAt) <= new Date()) { setError("Scheduled time must be in the future."); return; }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carouselId, scheduledAt, autoComment: comment || undefined }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to schedule.");
      setDone(true);
      onScheduled?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#16161e] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-white">Schedule Post</h2>
            <p className="text-white/40 text-sm mt-0.5 truncate max-w-[280px]">{title}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition flex items-center justify-center">
            ✕
          </button>
        </div>

        {!linkedinConnected && (
          <div className="mb-5 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-300 text-sm">
            ⚠️ Connect LinkedIn first to schedule posts.{" "}
            <a href="/dashboard/settings" className="underline hover:text-orange-200">Go to Settings →</a>
          </div>
        )}

        {done ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">⏰</div>
            <h3 className="text-lg font-bold text-white mb-2">Scheduled!</h3>
            <p className="text-white/40 text-sm mb-5">
              Your carousel will be posted on {new Date(`${date}T${time}`).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}.
            </p>
            <div className="flex gap-3">
              <a href="/dashboard/scheduled" className="flex-1 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/70 hover:text-white text-sm font-semibold text-center transition">
                View Scheduled
              </a>
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition">
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Date + Time */}
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

            {/* Auto-comment */}
            <div>
              <label className="text-[10px] text-white/30 uppercase tracking-widest font-semibold block mb-2">
                Auto-comment <span className="normal-case text-white/20">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a first comment to boost reach... (e.g. Full breakdown in the thread below 👇)"
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition resize-none"
              />
              <p className="text-white/20 text-[11px] mt-1">The comment is automatically posted right after the carousel goes live.</p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                ⚠️ {error}
              </div>
            )}

            <button
              onClick={handleSchedule}
              disabled={submitting || !date}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold text-sm transition shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

            <p className="text-center text-white/20 text-[11px]">
              Timezone: your local browser time
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
