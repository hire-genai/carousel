"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AutoScheduleConfig {
  enabled: boolean;
  postsPerDay: number;
}

interface Props {
  initialConfig: AutoScheduleConfig;
}

const PRESET_OPTIONS = [1, 2, 3, 4, 5];

export default function AutoSchedulePanel({ initialConfig }: Props) {
  const router = useRouter();
  const [config, setConfig] = useState(initialConfig);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [modalPostsPerDay, setModalPostsPerDay] = useState(initialConfig.postsPerDay);
  const [saving, setSaving] = useState(false);

  const isCustom = !PRESET_OPTIONS.includes(modalPostsPerDay);

  async function saveConfig(enabled: boolean, postsPerDay: number) {
    setSaving(true);
    try {
      const res = await fetch("/api/auto-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, postsPerDay }),
      });
      if (res.ok) {
        setConfig({ enabled, postsPerDay });
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  function handleToggle() {
    if (!config.enabled) {
      setModalPostsPerDay(config.postsPerDay);
      setShowConfigModal(true);
    } else {
      saveConfig(false, config.postsPerDay);
    }
  }

  function handleModalSave() {
    if (modalPostsPerDay < 1) return;
    saveConfig(true, modalPostsPerDay).then(() => setShowConfigModal(false));
  }

  function handleModalCancel() {
    setShowConfigModal(false);
    setModalPostsPerDay(config.postsPerDay);
  }

  return (
    <>
      {/* Compact Auto Schedule component — fits in header */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2 flex items-center justify-between whitespace-nowrap">
        <span className="text-xs font-semibold text-white/80">Auto Schedule</span>
        <div className="flex items-center gap-1.5 ml-2">
          {/* Toggle switch */}
          <button
            onClick={handleToggle}
            disabled={saving}
            aria-label={config.enabled ? "Disable auto schedule" : "Enable auto schedule"}
            className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 flex-shrink-0 ${
              config.enabled ? "bg-blue-600" : "bg-white/[0.12]"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                config.enabled ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>

          {/* Info icon */}
          <button
            onClick={() => setShowInfoModal(true)}
            className="w-5 h-5 rounded-full bg-white/[0.05] border border-white/[0.1] text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            aria-label="Auto Schedule info"
          >
            ⓘ
          </button>
        </div>
      </div>

      {/* Info modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#17171f] border border-white/[0.1] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-3">Auto Schedule</h3>
            <p className="text-white/60 text-sm mb-5">
              Automatically schedules completed Posts and Carousels for LinkedIn publishing.
            </p>

            <div className="mb-6">
              <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-3">How it works</p>
              <ul className="space-y-2 text-sm text-white/50">
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-white/30">•</span>
                  <span>Only completed content is scheduled.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-white/30">•</span>
                  <span>Drafts are ignored.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-white/30">•</span>
                  <span>A publish time is automatically selected.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-white/30">•</span>
                  <span>You can edit or cancel any scheduled post later.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex-shrink-0 text-white/30">•</span>
                  <span>Turning Auto Schedule OFF only affects future posts.</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-semibold transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Config modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#17171f] border border-white/[0.1] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-1">Configure Auto Schedule</h3>
            <p className="text-white/40 text-sm mb-6">Set how many posts to publish per day.</p>

            {/* Posts per day selector */}
            <div className="mb-5">
              <label className="text-[11px] text-white/40 uppercase tracking-widest font-semibold block mb-3">
                Posts Per Day
              </label>
              <div className="flex gap-2 flex-wrap items-center">
                {PRESET_OPTIONS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setModalPostsPerDay(n)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition border ${
                      modalPostsPerDay === n
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-white/[0.05] border-white/[0.1] text-white/50 hover:bg-white/[0.08] hover:text-white/80"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                {/* Custom number input */}
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={isCustom ? modalPostsPerDay : ""}
                  placeholder="..."
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v) && v >= 1 && v <= 20) setModalPostsPerDay(v);
                  }}
                  className="w-14 h-10 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white/70 text-center text-sm focus:outline-none focus:border-blue-500/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
            </div>

            <p className="text-white/35 text-xs mb-6 leading-relaxed">
              Your completed Posts and Carousels will be automatically published throughout the day
              at random times in morning, afternoon, and evening windows.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleModalCancel}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white/80 text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSave}
                disabled={saving || modalPostsPerDay < 1}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white text-sm font-semibold transition disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
