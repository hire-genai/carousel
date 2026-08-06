import { SkBlock, SkText, SkCard } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <SkText className="w-20 h-3" />
          <SkBlock className="w-48 h-9" />
          <SkText className="w-64 h-4" />
        </div>
        <div className="flex gap-3">
          <SkBlock className="w-28 h-10" />
          <SkBlock className="w-36 h-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <SkCard className="h-36" />
        <SkCard className="h-36" />
      </div>
    </div>
  );
}
