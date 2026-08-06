import { SkBlock, SkText, SkCard } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 space-y-2">
        <SkText className="w-16 h-3" />
        <SkBlock className="w-64 h-9" />
        <SkText className="w-72 h-4" />
      </div>

      {[0, 1, 2, 3].map((i) => (
        <SkCard key={i} className="h-40 mb-4" />
      ))}
    </div>
  );
}
