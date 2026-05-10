import { motion } from "framer-motion";
import { Users, MessageSquareText } from "lucide-react";
import type { LandingCopy } from "@/components/manus/landing-copy";

const fontSans = "var(--font-public-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontHeading = "var(--font-metrophobic), var(--font-public-sans), sans-serif";

type StatsCardsProps = {
  copy: LandingCopy["stats"];
};

export default function StatsCards({ copy }: StatsCardsProps) {
  return (
    <section className="relative py-10 md:py-14" style={{ background: "#030303" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "rgba(255,255,255,0.06)" }} />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "900px",
          height: "400px",
          background: "radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65 }}
            className="glass-card rounded-xl p-5 md:p-6 flex flex-col items-center text-center"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(99,102,241,0.2)",
              boxShadow: "0 8px 32px rgba(99,102,241,0.08), inset 0 1px 1px rgba(255,255,255,0.05)",
              minHeight: "160px",
              justifyContent: "center",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-3 flex-shrink-0"
              style={{
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
                boxShadow: "0 0 20px rgba(99,102,241,0.15)",
              }}
            >
              <Users size={18} style={{ color: "rgba(99,102,241,0.8)" }} />
            </div>

            <div
              style={{
                fontFamily: fontHeading,
                fontWeight: 800,
                fontSize: "1.5rem",
                color: "rgba(255,255,255,0.95)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                marginBottom: "0.35rem",
              }}
            >
              {copy.firstTitle}
            </div>

            <p
              style={{
                fontFamily: fontSans,
                fontWeight: 400,
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.4,
              }}
            >
              {copy.firstBody}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="glass-card rounded-xl p-5 md:p-6 flex flex-col items-center text-center"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(79,70,229,0.25)",
              boxShadow: "0 8px 32px rgba(79,70,229,0.08), inset 0 1px 1px rgba(255,255,255,0.05)",
              minHeight: "160px",
              justifyContent: "center",
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-3 flex-shrink-0"
              style={{
                background: "rgba(79,70,229,0.15)",
                border: "1px solid rgba(79,70,229,0.35)",
                boxShadow: "0 0 20px rgba(79,70,229,0.15)",
              }}
            >
              <MessageSquareText size={18} style={{ color: "rgba(129,140,248,0.85)" }} />
            </div>

            <div
              style={{
                fontFamily: fontHeading,
                fontWeight: 800,
                fontSize: "1.5rem",
                color: "rgba(255,255,255,0.95)",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                marginBottom: "0.35rem",
              }}
            >
              {copy.secondTitle}
            </div>

            <p
              style={{
                fontFamily: fontSans,
                fontWeight: 400,
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.4,
              }}
            >
              {copy.secondBody}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
