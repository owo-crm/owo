import { Mail, Send } from "lucide-react";
import { FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa6";
import Image from "next/image";
import Link from "next/link";
import type { LandingCopy } from "@/components/manus/landing-copy";

const OWO_LOGO = "/owoweb-logo.png";

const socialLinks = [
  { icon: Send, href: "https://t.me/owocrm", label: "Telegram", color: "rgba(0,136,204,0.7)" },
  { icon: FaInstagram, href: "https://instagram.com/owocrm", label: "Instagram", color: "rgba(224,49,98,0.7)" },
  { icon: FaFacebookF, href: "https://facebook.com/owocrm", label: "Facebook", color: "rgba(59,89,152,0.7)" },
  { icon: FaYoutube, href: "https://youtube.com/@owocrm", label: "YouTube", color: "rgba(255,0,0,0.7)" },
];

const fontSans = "var(--font-public-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontHeading = "var(--font-metrophobic), var(--font-public-sans), sans-serif";

type FooterProps = {
  copy: LandingCopy["footer"];
};

export default function Footer({ copy }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: "#030303",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "3rem 0 2rem",
      }}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex w-fit items-center gap-2 transition-opacity hover:opacity-80">
              <Image src={OWO_LOGO} alt="OWO CRM" width={32} height={32} style={{ display: "block" }} />
              <span
                style={{
                  fontFamily: fontHeading,
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  color: "rgba(255,255,255,0.8)",
                  letterSpacing: "-0.01em",
                }}
              >
                OWO CRM
              </span>
            </Link>
            <p
              style={{
                fontFamily: fontSans,
                fontWeight: 300,
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.25)",
                lineHeight: 1.6,
              }}
            >
              {copy.strapline}
            </p>
          </div>

          <nav className="flex flex-col gap-3">
            <p
              style={{
                fontFamily: fontHeading,
                fontWeight: 600,
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.6)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {copy.navigation}
            </p>
            {[
              { label: "Problem", href: "#problem" },
              { label: "Solution", href: "#solution" },
              { label: "How It Works", href: "#how-it-works" },
              { label: "Use Cases", href: "#use-cases" },
              { label: "FAQ", href: "#faq" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  fontFamily: fontSans,
                  fontWeight: 300,
                  fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.35)",
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.35)";
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-3">
            <p
              style={{
                fontFamily: fontHeading,
                fontWeight: 600,
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.6)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {copy.connect}
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={social.label}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "0.5rem",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(255,255,255,0.4)",
                      transition: "all 0.2s ease",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = social.color;
                      e.currentTarget.style.borderColor = social.color;
                      e.currentTarget.style.color = "white";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                      e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                    }}
                  >
                    <Icon size={16} />
                  </a>
                );
              })}
            </div>
            <a
              href="mailto:hello@owo.crm"
              style={{
                fontFamily: fontSans,
                fontWeight: 300,
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.35)",
                textDecoration: "none",
                transition: "color 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "0.5rem",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.65)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.35)";
              }}
            >
              <Mail size={14} />
              hello@owo.crm
            </a>
          </div>
        </div>

        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "2rem 0" }} />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p
            style={{
              fontFamily: fontSans,
              fontWeight: 300,
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.18)",
            }}
          >
            © {year} OWO CRM. {copy.copyright}
          </p>
          <div className="flex items-center gap-6">
            <a
              href="#"
              style={{
                fontFamily: fontSans,
                fontWeight: 300,
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.18)",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.18)";
              }}
            >
              {copy.privacy}
            </a>
            <a
              href="#"
              style={{
                fontFamily: fontSans,
                fontWeight: 300,
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.18)",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.18)";
              }}
            >
              {copy.terms}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
