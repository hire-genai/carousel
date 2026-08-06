import { SkBlock, SkText, SkCard } from "@/components/ui/Skeleton";

export default function PostsLoading() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <SkText className="w-16 h-3" />
          <SkBlock className="w-36 h-8" />
          <SkText className="w-56 h-4" />
        </div>
        <SkBlock className="w-28 h-9" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkCard key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}
