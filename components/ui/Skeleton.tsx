import type { CSSProperties } from "react";

export function SkBlock({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div className={`bg-white/[0.06] rounded-xl animate-pulse ${className}`} style={style} />;
}

export function SkText({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div className={`bg-white/[0.06] rounded-lg animate-pulse h-4 ${className}`} style={style} />;
}

export function SkCard({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div className={`bg-white/[0.03] border border-white/[0.06] rounded-2xl animate-pulse ${className}`} style={style} />;
}
