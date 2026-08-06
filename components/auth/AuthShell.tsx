"use client";

import Link from "next/link";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0a0a10] text-white relative overflow-hidden">
      {/* Glow bg */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/15 blur-[120px]" />
      </div>

      {/* Logo top */}
      <div className="p-6 sm:p-8">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-bold shadow-lg shadow-blue-500/20">
            S
          </div>
          <span className="font-bold text-lg tracking-tight">SkygenAI</span>
        </Link>
      </div>

      {/* Card */}
      <div className="flex items-center justify-center px-6 pt-8 pb-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black tracking-tight mb-2">{title}</h1>
            <p className="text-white/50 text-sm">{subtitle}</p>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-7 shadow-xl">
            {children}
          </div>

          {footer && <div className="text-center mt-6 text-sm text-white/50">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
