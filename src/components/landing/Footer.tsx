import { LANDING_CONFIG } from "@/config/landing";

export function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-2 text-sm text-[#8b8d9e]">
        <span>{LANDING_CONFIG.footer.note}</span>
        <span className="text-white/25">·</span>
        <a
          href={LANDING_CONFIG.telegramUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[#a8b2ff] transition-colors hover:text-[#c0c8ff]"
        >
          {LANDING_CONFIG.footer.linkLabel}
        </a>
      </div>
    </footer>
  );
}
