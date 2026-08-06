import { SkBlock, SkText } from "@/components/ui/Skeleton";

export default function NewCarouselLoading() {
  return (
    <div className="flex-1 flex flex-col bg-[#0f0f13] overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 pt-6 pb-4">
        <div className="space-y-2">
          <SkBlock className="w-56 h-8" />
          <SkText className="w-80 h-4" />
        </div>
        <div className="flex gap-3">
          <SkBlock className="w-28 h-10" />
          <SkBlock className="w-36 h-10" />
        </div>
      </div>

      {/* Action bar */}
      <div className="mx-6 mb-4">
        <SkBlock className="w-full h-11 rounded-lg" />
      </div>

      {/* Two-panel builder */}
      <div className="flex flex-col md:flex-row gap-5 px-6 pb-6 flex-1">
        <SkBlock className="w-64 flex-shrink-0 h-[580px]" />
        <SkBlock className="flex-1 h-[580px]" />
      </div>
    </div>
  );
}
