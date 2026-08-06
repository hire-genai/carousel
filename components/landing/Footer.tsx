import Link from "next/link";

const LINKS = {
  Product: [
    { href: "#features", label: "Features" },
    { href: "#how", label: "How it works" },
    { href: "#pricing", label: "Pricing" },
    { href: "/create", label: "Try demo" },
  ],
  Company: [
    { href: "#", label: "About" },
    { href: "#", label: "Blog" },
    { href: "#", label: "Careers" },
    { href: "#", label: "Contact" },
  ],
  Resources: [
    { href: "#", label: "Documentation" },
    { href: "#", label: "Help Center" },
    { href: "#", label: "Templates" },
    { href: "#", label: "Changelog" },
  ],
  Legal: [
    { href: "#", label: "Privacy Policy" },
    { href: "#", label: "Terms of Service" },
    { href: "#", label: "Cookies" },
    { href: "#", label: "Security" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#08080d] pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Top row */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                S
              </div>
              <span className="font-bold text-white text-lg tracking-tight">SkygenAI</span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs mb-4">
              AI-powered LinkedIn carousel creation. From idea to published post in minutes.
            </p>
            <div className="flex gap-2">
              {["𝕏", "in", "▶", "gh"].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition text-xs font-bold"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([col, items]) => (
            <div key={col}>
              <p className="text-white text-sm font-bold mb-4">{col}</p>
              <ul className="space-y-2.5">
                {items.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-white/40 hover:text-white text-sm transition">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">© 2026 SkygenAI. All rights reserved.</p>
          <p className="text-white/30 text-xs">Made for creators, by creators.</p>
        </div>
      </div>
    </footer>
  );
}
