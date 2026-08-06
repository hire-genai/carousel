"use client";

import { useState } from "react";
import SchedulePickerModal from "@/components/SchedulePickerModal";

export default function ScheduleButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 transition flex items-center gap-2 flex-shrink-0"
      >
        <span aria-hidden>+</span> Schedule a Post
      </button>
      {open && <SchedulePickerModal onClose={() => setOpen(false)} />}
    </>
  );
}
