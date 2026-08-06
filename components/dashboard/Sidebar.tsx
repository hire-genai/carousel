"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  userEmail: string;
  linkedinConnected: boolean;
}

const SECTIONS = [
  {
    label: "My Carousels",
    collapsible: true,
    items: [
      { href: "/dashboard/templates", label: "Templates", icon: "▦" },
      { href: "/dashboard/carousels/new", label: "Create New", icon: "+" },
      { href: "/dashboard/carousels", label: "My Carousels", icon: "🎨" },
      { href: "/dashboard/carousels/drafts", label: "Drafts", icon: "📄" },
    ],
  },
  {
    label: "My Posts",
    collapsible: true,
    items: [
      { href: "/dashboard/posts/new", label: "New Post", icon: "✏" },
      { href: "/dashboard/posts", label: "My Posts", icon: "📝" },
      { href: "/dashboard/posts/drafts", label: "Drafts", icon: "📄" },
    ],
  },
  {
    label: "Publish",
    items: [
      { href: "/dashboard/scheduled", label: "Scheduled", icon: "⏰" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/billing", label: "Billing", icon: "💳" },
      { href: "/dashboard/settings", label: "Settings", icon: "⚙", badge: "settings" },
    ],
  },
];

export default function Sidebar({ userEmail, linkedinConnected }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [carouselOpen, setCarouselOpen] = useState(() =>
    typeof window !== "undefined"
      ? pathname.startsWith("/dashboard/templates") || pathname.startsWith("/dashboard/carousels")
      : false
  );
  const [postGenOpen, setPostGenOpen] = useState(() =>
    typeof window !== "undefined" ? pathname.startsWith("/dashboard/posts") : false
  );
  const initial = userEmail.charAt(0).toUpperCase();

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/dashboard/carousels") return pathname === "/dashboard/carousels";
    if (href === "/dashboard/posts") return pathname === "/dashboard/posts";
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-[220px] bg-[#09090f] border-r border-white/[0.05] flex flex-col h-screen sticky top-0 select-none">

      {/* ── Logo ── */}
      <div className="px-4 py-5 border-b border-white/[0.05]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
            S
          </div>
          <span className="font-black text-white text-[15px] tracking-tight">SkygenAI</span>
        </Link>
      </div>

      {/* ── Nav sections ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-none">
        {SECTIONS.map((section) => {
          const isCollapsible = "collapsible" in section && section.collapsible;
          const isCarousels = section.label === "My Carousels";
          const isPostGen = section.label === "My Posts";
          const sectionOpen = isCarousels ? carouselOpen : isPostGen ? postGenOpen : true;

          return (
          <div key={section.label}>
            {isCollapsible ? (
              <button
                onClick={() => isCarousels ? setCarouselOpen((v) => !v) : setPostGenOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 mb-1.5 group"
              >
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] group-hover:text-white/40 transition">
                  {section.label}
                </p>
                <span className={`text-white/20 text-[10px] transition-transform ${sectionOpen ? "rotate-0" : "-rotate-90"}`}>▾</span>
              </button>
            ) : (
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] px-3 mb-1.5">
                {section.label}
              </p>
            )}
            {sectionOpen && (
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const showBadge = "badge" in item && item.badge === "settings" && !linkedinConnected;

                if ("accent" in item && item.accent) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                        active
                          ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md shadow-blue-500/25"
                          : "bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300 border border-blue-500/20"
                      }`}
                    >
                      <span className="text-sm">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                      active
                        ? "bg-white/[0.08] text-white"
                        : "text-white/45 hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className={`text-sm w-4 text-center ${active ? "text-white" : "text-white/30"}`}>
                      {item.icon}
                    </span>
                    {item.label}
                    {showBadge && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
            )}
          </div>
          );
        })}
      </nav>

      {/* ── Bottom panel ── */}
      <div className="border-t border-white/[0.05] p-2 space-y-1.5">

        {/* LinkedIn status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium transition-colors ${
          linkedinConnected
            ? "text-green-400/80 bg-green-500/5"
            : "text-white/30 bg-white/[0.03]"
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            linkedinConnected ? "bg-green-400" : "bg-white/20"
          }`} />
          <span className="truncate">
            {linkedinConnected ? "LinkedIn Connected" : "LinkedIn: Not connected"}
          </span>
        </div>

        {/* User row */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-bold text-xs text-white flex-shrink-0">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-white/60 truncate">{userEmail}</p>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={logout}
          disabled={loggingOut}
          className="w-full py-1.5 text-[11px] text-white/25 hover:text-white/60 transition rounded-lg"
        >
          {loggingOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
