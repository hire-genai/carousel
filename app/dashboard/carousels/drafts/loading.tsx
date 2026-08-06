import { SkBlock, SkText } from "@/components/ui/Skeleton";

export default function DraftsLoading() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <SkText className="w-16 h-3" />
          <SkBlock className="w-44 h-8" />
        </div>
        <SkBlock className="w-32 h-9" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
            <SkBlock className="w-full aspect-[4/5] rounded-none" />
            <div className="p-4 space-y-2">
              <SkText className="w-full" />
              <SkText className="w-2/3 h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
