import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/manus/ui/accordion";
import {
  HelpCircle,
  Lock,
  Zap,
  Users,
  MessageCircleMore,
  CircleCheckBig,
  Inbox,
  Bot,
} from "lucide-react";
import type { ReactNode } from "react";
import type { LandingCopy } from "@/components/manus/landing-copy";

interface FAQItem {
  id: string;
  icon: ReactNode;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: "mvp-scope",
    icon: <CircleCheckBig size={18} />,
    question: "What does OWO CRM solve in MVP?",
    answer:
      "MVP focuses on one loop: lead enters, owner becomes clear, next action is visible, and follow-up does not get lost. It is built for operational clarity, not for enterprise feature depth.",
  },
  {
    id: "lead-sources",
    icon: <Inbox size={18} />,
    question: "Which lead sources are supported right now?",
    answer:
      "Current canonical intake sources are Google Sheet, website form, and API. Manual lead creation is also part of the core workflow. All implemented sources converge into one pipeline.",
  },
  {
    id: "telegram-role",
    icon: <MessageCircleMore size={18} />,
    question: "Is Telegram the main product surface?",
    answer:
      "No. Web is the primary workspace. Telegram is a second surface for fast mobile actions and notifications on top of the same backend core.",
  },
  {
    id: "automation-scope",
    icon: <Bot size={18} />,
    question: "How much automation is included at this stage?",
    answer:
      "Automation is intentionally narrow in MVP: owner-assignment support, first-touch support, and follow-up task creation. A full workflow builder is not part of the current launch scope.",
  },
  {
    id: "early-access",
    icon: <Users size={18} />,
    question: "What is included in early access?",
    answer:
      "Early access gives selected teams guided onboarding, direct feedback channel with the product team, and access to the current MVP workflow. Feature scope can evolve between cohort waves based on feedback.",
  },
  {
    id: "not-included",
    icon: <Zap size={18} />,
    question: "What is not included yet?",
    answer:
      "Out of MVP scope today: deep workflow builder, giant integration marketplace, full enterprise customization, and finance-first or inventory-first product buildout.",
  },
  {
    id: "data-safety",
    icon: <Lock size={18} />,
    question: "How do you handle data and basic security?",
    answer:
      "We collect only the data needed to run lead operations and improve onboarding. Access is business-scoped in the app. We avoid unverified compliance claims on this page and share detailed security posture directly with onboarded teams.",
  },
  {
    id: "onboarding-support",
    icon: <HelpCircle size={18} />,
    question: "How does onboarding work at the start?",
    answer:
      "After you apply, we review fit and contact selected teams. Initial onboarding is hands-on and focused on getting one reliable lead-to-task flow running quickly.",
  },
];

const fontSans = "var(--font-public-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontHeading = "var(--font-metrophobic), var(--font-public-sans), sans-serif";

type FAQSectionProps = {
  copy: LandingCopy["faq"];
};

export default function FAQSection({ copy }: FAQSectionProps) {
  return (
    <section
      id="faq"
      className="relative py-24 md:py-32"
      style={{
        background: "#030303",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl mx-auto mb-14"
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
              marginBottom: "0.75rem",
            }}
          >
            {copy.heading} <span className="gradient-text">{copy.headingHighlight}</span>
          </h2>
          <p
            style={{
              fontFamily: fontSans,
              fontWeight: 300,
              fontSize: "0.95rem",
              color: "rgba(255,255,255,0.35)",
              lineHeight: 1.65,
            }}
          >
            {copy.description}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65 }}
          className="max-w-2xl mx-auto"
        >
          <Accordion type="single" collapsible className="w-full" defaultValue="mvp-scope">
            {copy.items.map((item, index) => (
              <AccordionItem key={item.id} value={item.id} className="border-b border-border/40 last:border-b-0">
                <AccordionTrigger
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontFamily: fontSans,
                    fontWeight: 500,
                    fontSize: "0.95rem",
                    padding: "1.25rem 0",
                  }}
                  className="hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div
                      style={{
                        color: "rgba(99,102,241,0.6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {faqItems[index]?.icon ?? <HelpCircle size={18} />}
                    </div>
                    <span>{item.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: fontSans,
                    fontWeight: 300,
                    fontSize: "0.9rem",
                    lineHeight: 1.7,
                    paddingLeft: "2.5rem",
                  }}
                >
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
