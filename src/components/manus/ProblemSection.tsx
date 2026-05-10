import { motion } from "framer-motion";
import { MessageSquare, GitBranch, Bell } from "lucide-react";
import type { LandingCopy } from "@/components/manus/landing-copy";

const problems = [
  {
    icon: MessageSquare,
    number: "01",
    title: "Leads come from everywhere",
    body: "Forms, ads, messages, and calls bring inbound across channels. But handoffs break. No clear owner. No consistent follow-up. Good opportunities go cold.",
  },
  {
    icon: GitBranch,
    number: "02",
    title: "No unified operational queue",
    body: "Spreadsheets, inbox threads, and chat updates split context. When someone asks what is next, the answer is usually scattered across tools.",
  },
  {
    icon: Bell,
    number: "03",
    title: "Manual follow-up is fragile",
    body: "First response slips. Reminders are missed. Tasks stay implicit. Without automation and clear accountability, lead velocity drops fast.",
  },
];

const fontSans = "var(--font-public-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontHeading = "var(--font-metrophobic), var(--font-public-sans), sans-serif";

type ProblemSectionProps = {
  copy: LandingCopy["problem"];
};

export default function ProblemSection({ copy }: ProblemSectionProps) {
  return (
    <section id="problem" className="relative py-24 md:py-32" style={{ background: "#030303" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "rgba(255,255,255,0.06)" }} />

      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="mb-16 md:mb-20"
        >
          <p className="section-label mb-4">{copy.sectionLabel}</p>
          <h2
            style={{
              fontFamily: fontHeading,
              fontWeight: 700,
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              color: "rgba(255,255,255,0.9)",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              maxWidth: "560px",
            }}
          >
            {copy.heading} <span className="gradient-text">{copy.headingHighlight}</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {copy.cards.map((p, i) => {
            const Icon = problems[i]?.icon ?? MessageSquare;
            return (
              <motion.div
                key={`${p.number}-${i}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
                className="glass-card relative overflow-hidden rounded-xl p-7"
              >
                <span
                  style={{
                    fontFamily: fontHeading,
                    fontWeight: 800,
                    fontSize: "5rem",
                    color: "rgba(255,255,255,0.03)",
                    position: "absolute",
                    top: "-0.5rem",
                    right: "1rem",
                    lineHeight: 1,
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                >
                  {p.number}
                </span>

                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Icon size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
                </div>

                <h3
                  style={{
                    fontFamily: fontHeading,
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    color: "rgba(255,255,255,0.85)",
                    letterSpacing: "-0.01em",
                    marginBottom: "0.75rem",
                  }}
                >
                  {p.title}
                </h3>
                <p
                  style={{
                    fontFamily: fontSans,
                    fontWeight: 300,
                    fontSize: "0.875rem",
                    color: "rgba(255,255,255,0.4)",
                    lineHeight: 1.65,
                  }}
                >
                  {p.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
