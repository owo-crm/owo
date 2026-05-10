/* =============================================================================
   OWO CRM - Capabilities Carousel
   Design: Obsidian Dark / Premium Minimal
   Auto-scrolling carousel showing Unified Inbox, AutoMail, Tasks capabilities
   ============================================================================= */
"use client";

import AutoScroll from "embla-carousel-auto-scroll";
import { motion, useReducedMotion } from "framer-motion";
import { Inbox, Mail, CheckSquare } from "lucide-react";
import { useMemo } from "react";
import type { ReactNode } from "react";
import type { LandingCopy } from "@/components/manus/landing-copy";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/manus/ui/carousel";

interface Capability {
  id: string;
  icon: ReactNode;
  title: string;
  description: string;
  color: string;
  glowColor: string;
}

const capabilities: Capability[] = [
  {
    id: "unified-inbox",
    icon: <Inbox size={32} />,
    title: "Unified Lead Inbox",
    description:
      "Forms, ads, API, imports - all leads in one queue. No scattered sources. Clear ownership from day one.",
    color: "rgba(99,102,241,0.7)",
    glowColor: "rgba(99,102,241,0.15)",
  },
  {
    id: "automail",
    icon: <Mail size={32} />,
    title: "AutoMail Sequences",
    description:
      "First touch and follow-ups on autopilot. Your team stays responsive while the system handles timing and consistency.",
    color: "rgba(34,197,94,0.7)",
    glowColor: "rgba(34,197,94,0.15)",
  },
  {
    id: "tasks",
    icon: <CheckSquare size={32} />,
    title: "Task Automation",
    description:
      "Deadlines, routing, accountability. Every action is tracked. No more 'I forgot to follow up' moments.",
    color: "rgba(245,158,11,0.7)",
    glowColor: "rgba(245,158,11,0.15)",
  },
];

const fontSans = "var(--font-public-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontHeading = "var(--font-metrophobic), var(--font-public-sans), sans-serif";

type CapabilitiesCarouselProps = {
  copy: LandingCopy["capabilities"];
};

export default function CapabilitiesCarousel({ copy }: CapabilitiesCarouselProps) {
  const shouldReduceMotion = useReducedMotion();

  const repeatedCapabilities = useMemo(
    () =>
      Array.from({ length: 3 }, (_, cloneIdx) =>
        copy.cards.map((card, index) => {
          const base = capabilities[index] ?? capabilities[0];
          return {
            ...base,
            title: card.title,
            description: card.description,
            id: `${card.id}-clone-${cloneIdx}`,
          };
        }),
      ).flat(),
    [copy.cards],
  );

  const carouselPlugins = useMemo(
    () =>
      shouldReduceMotion
        ? []
        : [
            AutoScroll({
              playOnInit: true,
              speed: 1.2,
              stopOnInteraction: false,
              stopOnMouseEnter: false,
              stopOnFocusIn: false,
            }),
          ],
    [shouldReduceMotion],
  );

  return (
    <section
      className="relative py-20 md:py-28"
      style={{
        background: "#030303",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "800px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(99,102,241,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="mb-12 text-center"
        >
          <p className="section-label mb-4">{copy.sectionLabel}</p>
          <h2
            style={{
              fontFamily: fontHeading,
              fontWeight: 700,
              fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)",
              color: "rgba(255,255,255,0.9)",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
            }}
          >
            {copy.heading} <span className="gradient-text">{copy.headingHighlight}</span>
          </h2>
        </motion.div>

        <div className="relative overflow-hidden">
          <Carousel opts={{ loop: true, align: "start" }} plugins={carouselPlugins}>
            <CarouselContent className="ml-0 gap-4 md:gap-5">
              {repeatedCapabilities.map((cap) => (
                <CarouselItem
                  key={cap.id}
                  className="flex basis-[88%] justify-center pl-0 sm:basis-[48%] lg:basis-[32%]"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55 }}
                    className="glass-card flex w-full flex-col items-center justify-between rounded-2xl p-8 text-center"
                    style={{
                      minHeight: "320px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      className="mb-5 flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: cap.glowColor,
                        border: `1px solid ${cap.color}`,
                        boxShadow: `0 0 20px ${cap.glowColor}`,
                        color: cap.color,
                      }}
                    >
                      {cap.icon}
                    </div>

                    <h3
                      style={{
                        fontFamily: fontHeading,
                        fontWeight: 700,
                        fontSize: "1.25rem",
                        color: "rgba(255,255,255,0.9)",
                        letterSpacing: "-0.01em",
                        marginBottom: "0.75rem",
                      }}
                    >
                      {cap.title}
                    </h3>

                    <p
                      style={{
                        fontFamily: fontSans,
                        fontWeight: 300,
                        fontSize: "0.9rem",
                        color: "rgba(255,255,255,0.4)",
                        lineHeight: 1.65,
                      }}
                    >
                      {cap.description}
                    </p>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-8 md:w-16"
            style={{
              background: "linear-gradient(to right, rgba(3,3,3,1), transparent)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-8 md:w-16"
            style={{
              background: "linear-gradient(to left, rgba(3,3,3,1), transparent)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
