"use client";

import { useState } from "react";
import Link from "next/link";
import SchedulePickerModal from "@/components/SchedulePickerModal";
import { useRouter } from "next/navigation";

interface CarouselItem {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  thumbGradient: string;
  slideCount: number;
}

interface Props {
  carousels: CarouselItem[];
}

export default function CarouselGrid({ carousels }: Props) {
  const router = useRouter();
  const [scheduleFor, setScheduleFor] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this carousel draft?")) return;
    setDeleting(id);
    try {
      const r = await fetch(`/api/carousels/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Delete failed");
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {carousels.map((c) => (
          <div key={c.id} className="group bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden hover:bg-white/[0.05] hover:border-white/[0.14] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30 flex flex-col">
            {/* Thumbnail — clickable to edit */}
            <Link href={`/dashboard/carousels/new?id=${c.id}`} className="block">
              <div
                className="w-full aspect-[4/5] relative overflow-hidden"
                style={{ background: c.thumbGradient }}
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/[0.06]" />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-black/[0.15]" />
                <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/30 backdrop-blur text-white text-[10px] font-bold">
                  {c.slideCount} slides
                </div>
                <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                  HOOK
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex gap-[2px]">
                  {Array.from({ length: Math.min(c.slideCount, 10) }).map((_, idx) => (
                    <div key={idx} className="h-[2px] flex-1 rounded-full bg-white/30" />
                  ))}
                </div>
              </div>
            </Link>

            {/* Info */}
            <div className="p-4 flex-1 flex flex-col">
              <Link href={`/dashboard/carousels/new?id=${c.id}`} className="flex-1">
                <p className="text-white font-bold text-sm leading-snug line-clamp-2 mb-2 group-hover:text-white transition-colors">
                  {c.title}
                </p>
              </Link>
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/30 text-[11px]">
                  {new Date(c.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${c.status === "published" ? "bg-green-500/15 text-green-400" : "bg-white/[0.06] text-white/30"}`}>
                  {c.status}
                </span>
              </div>
              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-white/[0.05]">
                <Link
                  href={`/dashboard/carousels/new?id=${c.id}`}
                  className="flex-1 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/10 text-white/50 hover:text-white text-[11px] font-semibold text-center transition"
                >
                  Edit
                </Link>
                <button
                  onClick={() => setScheduleFor({ id: c.id, title: c.title })}
                  className="flex-1 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 text-[11px] font-semibold transition"
                >
                  ⏰ Schedule
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={deleting === c.id}
                  className="px-2 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-[11px] font-semibold transition disabled:opacity-50"
                  title="Delete draft"
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Create new card */}
        <Link
          href="/dashboard/templates"
          className="border-2 border-dashed border-white/[0.07] rounded-2xl flex flex-col items-center justify-center gap-3 p-8 text-white/25 hover:text-white/50 hover:border-blue-500/30 hover:bg-blue-500/[0.03] transition-all duration-200 min-h-[200px]"
        >
          <div className="w-10 h-10 rounded-2xl border border-white/[0.08] flex items-center justify-center text-xl">+</div>
          <p className="text-xs font-semibold text-center leading-relaxed">New Carousel</p>
        </Link>
      </div>

      {scheduleFor && (
        <SchedulePickerModal
          preselectedId={scheduleFor.id}
          preselectedTitle={scheduleFor.title}
          onClose={() => setScheduleFor(null)}
        />
      )}
    </>
  );
}
