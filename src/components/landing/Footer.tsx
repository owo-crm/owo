import type { LandingConfig } from "@/config/landing";

export function Footer({ config }: { config: LandingConfig }) {
  return (
    <footer className="border-t border-white/10 px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-2 text-sm text-[#8b8d9e]">
        <span>{config.footer.note}</span>
        <span className="text-white/25">·</span>
        <a
          href={config.telegramUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[#a8b2ff] transition-colors hover:text-[#c0c8ff]"
        >
          {config.footer.linkLabel}
        </a>
      </div>
    </footer>
  );
}
