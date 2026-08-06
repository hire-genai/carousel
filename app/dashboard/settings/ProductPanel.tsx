"use client";

import { useState } from "react";

interface Props {
  initialUrl: string | null;
}

export default function ProductPanel({ initialUrl }: Props) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const r = await fetch("/api/user/product-url", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productWebsiteUrl: url.trim() || null }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Save failed");
      showToast("Product URL saved!", true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Save failed", false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-4 relative">
      <h2 className="text-white font-bold text-lg mb-1">Your Product</h2>
      <p className="text-white/40 text-sm mb-5">
        Save your deployed product URL once. Smart Carousel will automatically use this website
        whenever you create a Product carousel.
      </p>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
            Product Website URL
          </p>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourproduct.com"
            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition"
          />
          <p className="text-[11px] text-white/25 mt-1.5">
            Smart Carousel will scan this URL each time you generate a Product carousel.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            "Save"
          )}
        </button>
      </div>

      {toast && (
        <div
          className={`absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${
            toast.ok
              ? "bg-green-500/15 border-green-500/25 text-green-300"
              : "bg-red-500/15 border-red-500/25 text-red-300"
          }`}
        >
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
}
