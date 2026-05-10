import { motion } from "framer-motion";
import { Globe, MessageCircle } from "lucide-react";
import type { LandingCopy } from "@/components/manus/landing-copy";

const fontSans = "var(--font-public-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontHeading = "var(--font-metrophobic), var(--font-public-sans), sans-serif";

type AccessSectionProps = {
  copy: LandingCopy["access"];
};

export default function AccessSection({ copy }: AccessSectionProps) {
  return (
    <section
      id="access"
      className="relative py-16 md:py-20"
      style={{
        background: "#030303",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <h2
            style={{
              fontFamily: fontHeading,
              fontWeight: 700,
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              color: "rgba(255,255,255,0.9)",
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              marginBottom: "1.5rem",
              textAlign: "center",
            }}
          >
            {copy.heading}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "0.75rem",
                padding: "1.5rem",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Globe size={20} style={{ color: "rgba(99,102,241,0.7)" }} />
                <h3
                  style={{
                    fontFamily: fontHeading,
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {copy.webTitle}
                </h3>
              </div>
              <p
                style={{
                  fontFamily: fontSans,
                  fontWeight: 300,
                  fontSize: "0.85rem",
                  color: "rgba(255,255,255,0.35)",
                  lineHeight: 1.6,
                }}
              >
                {copy.webBody}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "0.75rem",
                padding: "1.5rem",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <MessageCircle size={20} style={{ color: "rgba(168,85,247,0.7)" }} />
                <h3
                  style={{
                    fontFamily: fontHeading,
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: "rgba(255,255,255,0.85)",
                  }}
                >
                  {copy.tgTitle}
                </h3>
              </div>
              <p
                style={{
                  fontFamily: fontSans,
                  fontWeight: 300,
                  fontSize: "0.85rem",
                  color: "rgba(255,255,255,0.35)",
                  lineHeight: 1.6,
                }}
              >
                {copy.tgBody}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
