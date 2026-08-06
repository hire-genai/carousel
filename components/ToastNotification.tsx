"use client";

import { useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

type ToastListener = (item: ToastItem) => void;

// ─── Module-level singleton ───────────────────────────────────────────────────
// Shared across all client-side renders in the same tab. The ToastContainer
// subscribes once; useToast() calls emit() from anywhere in the app.

let _counter = 0;
const _listeners = new Set<ToastListener>();

function _emit(message: string, type: ToastType = "success") {
  const item: ToastItem = { id: _counter++, message, type };
  _listeners.forEach((fn) => fn(item));
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useToast() {
  return {
    toast: (message: string, type?: ToastType) => _emit(message, type),
  };
}

// ─── Styles per type ─────────────────────────────────────────────────────────

const TYPE_STYLES: Record<
  ToastType,
  { border: string; iconBg: string; iconColor: string; icon: string }
> = {
  success: {
    border: "border-green-500/25",
    iconBg: "bg-green-500/20",
    iconColor: "text-green-400",
    icon: "✓",
  },
  error: {
    border: "border-red-500/25",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    icon: "✕",
  },
  info: {
    border: "border-blue-500/25",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    icon: "ℹ",
  },
};

// ─── ToastContainer ──────────────────────────────────────────────────────────

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handler(item: ToastItem) {
      setToasts((prev) => [...prev, item]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id));
      }, 3000);
    }

    _listeners.add(handler);
    return () => {
      _listeners.delete(handler);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => {
        const s = TYPE_STYLES[t.type];
        return (
          <div
            key={t.id}
            className={`flex items-center gap-3 pl-3 pr-5 py-3 rounded-2xl bg-[#1c1c28]/95 backdrop-blur-md border ${s.border} shadow-2xl shadow-black/50 text-sm text-white max-w-sm pointer-events-auto`}
          >
            {/* Icon badge */}
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${s.iconBg} ${s.iconColor}`}
            >
              {s.icon}
            </span>
            {/* Message */}
            <span className="text-white/90 leading-snug">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
