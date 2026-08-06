import { SkBlock, SkText, SkCard } from "@/components/ui/Skeleton";

export default function ScheduledLoading() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-2">
          <SkText className="w-16 h-3" />
          <SkBlock className="w-52 h-9" />
          <SkText className="w-56 h-4" />
        </div>
        <SkBlock className="w-40 h-10 mt-1" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <SkCard key={i} className="h-20" />
        ))}
      </div>

      <div className="space-y-3">
        <SkBlock className="w-32 h-6" />
        {Array.from({ length: 4 }).map((_, i) => (
          <SkCard key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
