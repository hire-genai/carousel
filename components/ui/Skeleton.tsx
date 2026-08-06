export function SkBlock({ className = "" }: { className?: string }) {
  return <div className={`bg-white/[0.06] rounded-xl animate-pulse ${className}`} />;
}

export function SkText({ className = "" }: { className?: string }) {
  return <div className={`bg-white/[0.06] rounded-lg animate-pulse h-4 ${className}`} />;
}

export function SkCard({ className = "" }: { className?: string }) {
  return <div className={`bg-white/[0.03] border border-white/[0.06] rounded-2xl animate-pulse ${className}`} />;
}
