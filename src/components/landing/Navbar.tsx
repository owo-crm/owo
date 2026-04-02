import { LANDING_CONFIG } from "@/config/landing";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[rgba(13,14,21,0.75)] backdrop-blur-[14px]">
      <div className="mx-auto flex h-[60px] w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="inline-flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/owo-logo.png"
            alt={`${LANDING_CONFIG.productName} logo`}
            className="h-8 w-8 rounded-lg border border-white/15 object-cover"
          />
          <span className="text-lg font-bold tracking-tight text-[#e8e9f0]">
            {LANDING_CONFIG.productName}
          </span>
        </a>

        <a
          href={`#${LANDING_CONFIG.survey.sectionId}`}
          className="inline-flex items-center rounded-lg bg-[#6b7ff0] px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#8b9bf3]"
        >
          {LANDING_CONFIG.nav.cta}
        </a>
      </div>
    </header>
  );
}
