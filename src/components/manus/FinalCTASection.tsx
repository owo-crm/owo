import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { LandingCopy } from "@/components/manus/landing-copy";

const fontSans = "var(--font-public-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontHeading = "var(--font-metrophobic), var(--font-public-sans), sans-serif";

type FinalCTASectionProps = {
  copy: LandingCopy["finalCta"];
};

export default function FinalCTASection({ copy }: FinalCTASectionProps) {
  return (
    <section className="relative py-28 md:py-36 overflow-hidden" style={{ background: "#030303" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "rgba(255,255,255,0.06)" }} />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "800px",
          height: "500px",
          background: "radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, rgba(244,63,94,0.06) 50%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "-5%",
          width: "400px",
          height: "100px",
          borderRadius: "9999px",
          background: "rgba(99,102,241,0.04)",
          border: "1px solid rgba(99,102,241,0.08)",
          transform: "rotate(-8deg)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          right: "-5%",
          width: "300px",
          height: "80px",
          borderRadius: "9999px",
          background: "rgba(244,63,94,0.04)",
          border: "1px solid rgba(244,63,94,0.08)",
          transform: "rotate(10deg)",
          pointerEvents: "none",
        }}
      />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto text-center"
        >
          <p className="section-label mb-5">{copy.sectionLabel}</p>
          <h2
            style={{
              fontFamily: fontHeading,
              fontWeight: 800,
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              color: "rgba(255,255,255,0.95)",
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              marginBottom: "1.25rem",
            }}
          >
            {copy.heading} <span className="gradient-text">{copy.headingHighlight}</span>
          </h2>
          <p
            style={{
              fontFamily: fontSans,
              fontWeight: 300,
              fontSize: "1rem",
              color: "rgba(255,255,255,0.38)",
              lineHeight: 1.7,
              marginBottom: "2.5rem",
              maxWidth: "460px",
              margin: "0 auto 2.5rem",
            }}
          >
            {copy.body}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#early-access"
              style={{
                fontFamily: fontSans,
                fontWeight: 500,
                fontSize: "0.9rem",
                color: "white",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.18)",
                padding: "0.85rem 2rem",
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
              {copy.primaryCta}
              <ArrowRight size={15} />
            </a>
            <a
              href="/app"
              style={{
                fontFamily: fontSans,
                fontWeight: 400,
                fontSize: "0.9rem",
                color: "rgba(255,255,255,0.4)",
                padding: "0.85rem 1.5rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            >
              {copy.secondaryCta}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
