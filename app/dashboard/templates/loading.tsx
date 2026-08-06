import { SkBlock, SkText } from "@/components/ui/Skeleton";

export default function TemplatesLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8 space-y-2">
        <SkText className="w-20 h-3" />
        <SkBlock className="w-48 h-9" />
        <SkText className="w-80 h-4" />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-8">
        {[80, 64, 72, 56, 68, 60].map((w, i) => (
          <SkBlock key={i} className={`w-${w} h-9`} style={{ width: `${w * 4}px` } as React.CSSProperties} />
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
            <SkBlock className="w-full aspect-[4/5] rounded-none" />
            <div className="p-3 space-y-2">
              <SkText className="w-3/4" />
              <SkText className="w-full h-3" />
              <SkBlock className="w-full h-9 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
