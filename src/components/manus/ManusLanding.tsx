"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AccessSection from "@/components/manus/AccessSection";
import CapabilitiesCarousel from "@/components/manus/CapabilitiesCarousel";
import CompactFlow from "@/components/manus/CompactFlow";
import EarlyAccessSection from "@/components/manus/EarlyAccessSection";
import FAQSection from "@/components/manus/FAQSection";
import FinalCTASection from "@/components/manus/FinalCTASection";
import Footer from "@/components/manus/Footer";
import Navbar from "@/components/manus/Navbar";
import ProblemSection from "@/components/manus/ProblemSection";
import StatsCards from "@/components/manus/StatsCards";
import UseCasesSection from "@/components/manus/UseCasesSection";
import { landingCopyByLang, type LandingLang } from "@/components/manus/landing-copy";
import { HeroGeometric } from "@/components/manus/ui/shape-landing-hero";

const LANDING_LANG_KEY = "owocrm-landing-lang";
const fontSans = "var(--font-public-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export function ManusLanding() {
  const [lang, setLang] = useState<LandingLang>("en");

  useEffect(() => {
    const stored = localStorage.getItem(LANDING_LANG_KEY);
    if (stored === "pl" || stored === "en") {
      setLang(stored);
      return;
    }
    const browserLang = navigator.language.toLowerCase();
    setLang(browserLang.startsWith("pl") ? "pl" : "en");
  }, []);

  useEffect(() => {
    localStorage.setItem(LANDING_LANG_KEY, lang);
  }, [lang]);

  const copy = useMemo(() => landingCopyByLang[lang], [lang]);

  return (
    <div style={{ background: "#030303", minHeight: "100vh", overflowX: "hidden" }}>
      <Navbar copy={copy.nav} lang={lang} onLangChange={setLang} />

      <HeroGeometric
        badge={copy.hero.badge}
        title1={copy.hero.title1}
        title2={copy.hero.title2}
        description={copy.hero.description}
      >
        <div className="mt-2 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="#early-access"
            style={{
              fontFamily: fontSans,
              fontWeight: 500,
              fontSize: "0.9rem",
              color: "white",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.18)",
              padding: "0.8rem 1.75rem",
              borderRadius: "0.5rem",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.13)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {copy.hero.primaryCta}
            <ArrowRight size={15} />
          </a>

          <a
            href="#how-it-works"
            style={{
              fontFamily: fontSans,
              fontWeight: 400,
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.4)",
              padding: "0.8rem 1.25rem",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.7)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            }}
          >
            {copy.hero.secondaryCta}
          </a>
        </div>
      </HeroGeometric>

      <CapabilitiesCarousel copy={copy.capabilities} />
      <ProblemSection copy={copy.problem} />
      <CompactFlow copy={copy.flow} />
      <EarlyAccessSection copy={copy.earlyAccess} />
      <StatsCards copy={copy.stats} />
      <AccessSection copy={copy.access} />
      <UseCasesSection copy={copy.useCases} />
      <FAQSection copy={copy.faq} />
      <FinalCTASection copy={copy.finalCta} />
      <Footer copy={copy.footer} />
    </div>
  );
}
