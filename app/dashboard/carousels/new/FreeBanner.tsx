"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FreeBanner({ linkedinConnected }: { linkedinConnected: boolean }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [dismissBanner, setDismissBanner] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || dismissBanner || linkedinConnected) {
    return null;
  }

  return (
    <div className="relative flex items-center gap-3 bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shrink-0">
      <svg className="h-5 w-5 text-blue-200 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"/>
      </svg>
      <span>
        You&apos;re currently on a <strong>FREE plan</strong> that doesn&apos;t allow you to post on LinkedIn.{" "}
        <button onClick={() => router.push("/dashboard/billing")} className="underline hover:text-blue-100">
          Upgrade to continue →
        </button>
      </span>
      <button
        onClick={() => setDismissBanner(true)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-200"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
}
