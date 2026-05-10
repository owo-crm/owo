import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Wrench, Megaphone, Briefcase } from "lucide-react";
import type { LandingCopy } from "@/components/manus/landing-copy";

const useCases = [
  {
    id: "agencies",
    icon: Megaphone,
    label: "Agencies",
    title: "Run high-volume inbound with clarity",
    body: "Agencies handle leads from ads, forms, referrals, and direct messages at the same time. OWO CRM keeps each opportunity in one operational queue from first inquiry to signed deal.",
    detail: "Assign owners, track next tasks, and keep context visible without hopping across disconnected tools.",
  },
  {
    id: "consulting",
    icon: Briefcase,
    label: "Consulting",
    title: "Manage long B2B cycles without losing momentum",
    body: "Consulting deals involve multiple stakeholders and long follow-up windows. OWO CRM keeps touchpoints linked to owners and next actions so teams can move deals forward consistently.",
    detail: "Track stakeholder context, follow-up commitments, and task completion in one place.",
  },
  {
    id: "services",
    icon: Wrench,
    label: "Service Businesses",
    title: "Turn inquiries into scheduled work",
    body: "For service teams, speed and consistency matter more than fancy dashboards. OWO CRM helps teams respond quickly and keep follow-up visible until the job is booked or closed.",
    detail: "Use task-driven follow-up and owner visibility to reduce missed opportunities.",
  },
  {
    id: "smb",
    icon: Building2,
    label: "Small Teams",
    title: "Graduate from spreadsheet chaos",
    body: "Small teams often start with shared sheets and chat threads. OWO CRM gives one structured pipeline without unnecessary complexity.",
    detail: "Start with the core loop: intake, ownership, next action, and visible follow-up.",
  },
];

const fontSans = "var(--font-public-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontHeading = "var(--font-metrophobic), var(--font-public-sans), sans-serif";
const fontMono = "var(--font-public-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

type UseCasesSectionProps = {
  copy: LandingCopy["useCases"];
};

export default function UseCasesSection({ copy }: UseCasesSectionProps) {
  const [active, setActive] = useState(copy.tabs[0]?.id ?? "agencies");
  const activeCase = copy.tabs.find((u) => u.id === active) ?? copy.tabs[0];

  if (!activeCase) {
    return null;
  }

  return (
    <section id="use-cases" className="relative py-24 md:py-32" style={{ background: "#030303" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "rgba(255,255,255,0.06)" }} />

      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="mb-12"
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
              maxWidth: "520px",
            }}
          >
            {copy.heading} <span className="gradient-text">{copy.headingHighlight}</span>
          </h2>
        </motion.div>

        <div className="flex flex-wrap gap-2 mb-10">
          {copy.tabs.map((uc, index) => {
            const Icon = useCases[index]?.icon ?? Building2;
            const isActive = active === uc.id;
            return (
              <button
                key={uc.id}
                onClick={() => setActive(uc.id)}
                style={{
                  fontFamily: fontSans,
                  fontWeight: isActive ? 500 : 400,
                  fontSize: "0.85rem",
                  color: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.4)",
                  background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                  border: isActive ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "0.375rem",
                  padding: "0.5rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
              >
                <Icon size={14} />
                {uc.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="glass-card rounded-2xl p-8 md:p-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div>
                <h3
                  style={{
                    fontFamily: fontHeading,
                    fontWeight: 700,
                    fontSize: "1.35rem",
                    color: "rgba(255,255,255,0.9)",
                    letterSpacing: "-0.02em",
                    marginBottom: "0.75rem",
                  }}
                >
                  {activeCase.title}
                </h3>
                <p
                  style={{
                    fontFamily: fontSans,
                    fontWeight: 300,
                    fontSize: "0.9rem",
                    color: "rgba(255,255,255,0.5)",
                    lineHeight: 1.7,
                  }}
                >
                  {activeCase.body}
                </p>
              </div>
              <div
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "0.75rem",
                  padding: "1.25rem 1.5rem",
                }}
              >
                <p
                  style={{
                    fontFamily: fontMono,
                    fontSize: "0.65rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(99,102,241,0.6)",
                    marginBottom: "0.6rem",
                  }}
                >
                  {copy.inPractice}
                </p>
                <p
                  style={{
                    fontFamily: fontSans,
                    fontWeight: 300,
                    fontSize: "0.875rem",
                    color: "rgba(255,255,255,0.45)",
                    lineHeight: 1.65,
                  }}
                >
                  {activeCase.detail}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
