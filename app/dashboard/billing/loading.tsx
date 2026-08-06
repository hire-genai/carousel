import { SkBlock, SkText, SkCard } from "@/components/ui/Skeleton";

export default function BillingLoading() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8 space-y-2">
        <SkText className="w-16 h-3" />
        <SkBlock className="w-36 h-9" />
        <SkText className="w-56 h-4" />
      </div>
      <SkCard className="h-64 mb-4" />
      <SkCard className="h-32" />
    </div>
  );
}
