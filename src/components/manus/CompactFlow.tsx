import { motion } from "framer-motion";
import { Inbox, Bot, CheckCircle2, ArrowRight } from "lucide-react";
import type { LandingCopy } from "@/components/manus/landing-copy";

const stages = [
  {
    icon: Inbox,
    title: "Ingest to one queue",
    description: "Google Sheet, website form, API",
    color: "rgba(99,102,241,0.8)",
    glow: "rgba(99,102,241,0.15)",
  },
  {
    icon: Bot,
    title: "Assign and trigger next action",
    description: "Narrow, reliable MVP automation",
    color: "rgba(139,92,246,0.8)",
    glow: "rgba(139,92,246,0.15)",
  },
  {
    icon: CheckCircle2,
    title: "Close with context",
    description: "Owner and next task stay visible",
    color: "rgba(244,63,94,0.8)",
    glow: "rgba(244,63,94,0.15)",
  },
];

const fontSans = "var(--font-public-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontHeading = "var(--font-metrophobic), var(--font-public-sans), sans-serif";

type CompactFlowProps = {
  copy: LandingCopy["flow"];
};

export default function CompactFlow({ copy }: CompactFlowProps) {
  return (
    <section id="how-it-works" className="relative py-20 md:py-28" style={{ background: "#030303" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "rgba(255,255,255,0.06)" }} />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "1000px",
          height: "600px",
          background: "radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
          >
            <p className="section-label mb-3">{copy.sectionLabel}</p>
            <h2
              style={{
                fontFamily: fontHeading,
                fontWeight: 700,
                fontSize: "clamp(1.75rem, 4vw, 2.2rem)",
                color: "rgba(255,255,255,0.9)",
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                marginBottom: "1rem",
              }}
            >
              {copy.heading}
            </h2>
            <p
              style={{
                fontFamily: fontSans,
                fontWeight: 300,
                fontSize: "0.95rem",
                color: "rgba(255,255,255,0.45)",
                lineHeight: 1.7,
                maxWidth: "420px",
              }}
            >
              {copy.description}
            </p>

            <div className="mt-8 space-y-3">
              {copy.bullets.map((benefit, i) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "rgba(99,102,241,0.6)",
                      marginTop: "0.5rem",
                      flexShrink: 0,
                    }}
                  />
                  <p
                    style={{
                      fontFamily: fontSans,
                      fontWeight: 400,
                      fontSize: "0.9rem",
                      color: "rgba(255,255,255,0.6)",
                      lineHeight: 1.5,
                    }}
                  >
                    {benefit}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="space-y-4"
          >
            {copy.stages.map((stage, i) => {
              const base = stages[i] ?? stages[0];
              const Icon = base.icon;
              return (
                <motion.div
                  key={stage.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative"
                >
                  <div
                    className="glass-card rounded-lg p-4 md:p-5"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid ${base.color.replace("0.8", "0.2")}`,
                      boxShadow: `0 8px 24px ${base.glow}, inset 0 1px 1px rgba(255,255,255,0.05)`,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "1rem",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: base.glow,
                        border: `1px solid ${base.color}`,
                        boxShadow: `0 0 12px ${base.glow}`,
                      }}
                    >
                      <Icon size={16} style={{ color: base.color }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3
                        style={{
                          fontFamily: fontHeading,
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          color: "rgba(255,255,255,0.9)",
                          letterSpacing: "-0.01em",
                          marginBottom: "0.25rem",
                        }}
                      >
                        {stage.title}
                      </h3>
                      <p
                        style={{
                          fontFamily: fontSans,
                          fontWeight: 300,
                          fontSize: "0.8rem",
                          color: "rgba(255,255,255,0.4)",
                          lineHeight: 1.4,
                        }}
                      >
                        {stage.description}
                      </p>
                    </div>
                  </div>

                  {i < stages.length - 1 && (
                    <div className="hidden md:flex justify-center py-2" style={{ color: "rgba(255,255,255,0.15)" }}>
                      <ArrowRight size={16} style={{ transform: "rotate(90deg)" }} />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
