import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { LandingCopy, LandingLang } from "@/components/manus/landing-copy";

const OWO_LOGO = "/owoweb-logo.png";
const fontSans = "var(--font-public-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontHeading = "var(--font-metrophobic), var(--font-public-sans), sans-serif";

type NavbarProps = {
  copy: LandingCopy["nav"];
  lang: LandingLang;
  onLangChange: (lang: LandingLang) => void;
};

export default function Navbar({ copy, lang, onLangChange }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleLang = () => onLangChange(lang === "pl" ? "en" : "pl");

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(3,3,3,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      }}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="group flex items-center gap-2 transition-opacity hover:opacity-80">
            <Image src={OWO_LOGO} alt="OWO CRM" width={32} height={32} style={{ display: "block" }} />
            <span style={{ fontFamily: fontHeading, fontWeight: 700, fontSize: "1rem", color: "rgba(255,255,255,0.9)", letterSpacing: "-0.02em" }}>
              OWO CRM
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {copy.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  fontFamily: fontSans,
                  fontWeight: 400,
                  fontSize: "0.875rem",
                  color: "rgba(255,255,255,0.45)",
                  transition: "color 0.2s ease",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              aria-label={copy.langToggleAria}
              onClick={toggleLang}
              style={{
                fontFamily: fontSans,
                fontWeight: 600,
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.85)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: "0.45rem 0.65rem",
                borderRadius: "0.375rem",
                letterSpacing: "0.02em",
                minWidth: "58px",
              }}
            >
              {lang === "pl" ? "PL" : "EN"}
            </button>
            <a
              href="#early-access"
              style={{
                fontFamily: fontSans,
                fontWeight: 500,
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.85)",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                padding: "0.5rem 1.25rem",
                borderRadius: "0.375rem",
                transition: "all 0.2s ease",
                textDecoration: "none",
                letterSpacing: "0.005em",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
              }}
            >
              {copy.cta}
            </a>
          </div>

          <button
            className="p-2 md:hidden"
            style={{ color: "rgba(255,255,255,0.6)", background: "none", border: "none" }}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              background: "rgba(3,3,3,0.95)",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="container mx-auto flex flex-col gap-4 px-4 py-4">
              <button
                type="button"
                onClick={toggleLang}
                style={{
                  fontFamily: fontSans,
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.9)",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "0.375rem",
                  padding: "0.6rem 0.8rem",
                  textAlign: "left",
                }}
              >
                {lang === "pl" ? "PL" : "EN"}
              </button>
              {copy.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontFamily: fontSans,
                    fontWeight: 400,
                    fontSize: "0.95rem",
                    color: "rgba(255,255,255,0.6)",
                    textDecoration: "none",
                    padding: "0.5rem 0",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#early-access"
                onClick={() => setMenuOpen(false)}
                style={{
                  fontFamily: fontSans,
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  color: "white",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "0.375rem",
                  textDecoration: "none",
                  textAlign: "center",
                  marginTop: "0.5rem",
                }}
              >
                {copy.cta}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
