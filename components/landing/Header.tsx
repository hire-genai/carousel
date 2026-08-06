"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "#features", label: "Features" },
    { href: "#how", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
    { href: "#testimonials", label: "Testimonials" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#0a0a10]/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            S
          </div>
          <span className="font-bold text-white text-lg tracking-tight">SkygenAI</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-white/50 hover:text-white transition font-medium"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Auth CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-white/70 hover:text-white transition font-medium"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold shadow-lg shadow-blue-500/20 transition"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden w-9 h-9 rounded-lg bg-white/5 border border-white/10 text-white/60 flex items-center justify-center"
          aria-label="Menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/[0.06] bg-[#0a0a10]/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2 text-sm text-white/60 hover:text-white transition font-medium"
              >
                {l.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2 border-t border-white/[0.06]">
              <Link
                href="/login"
                className="flex-1 py-2.5 text-sm text-center rounded-xl border border-white/10 text-white/70 hover:text-white font-medium"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="flex-1 py-2.5 text-sm text-center rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
