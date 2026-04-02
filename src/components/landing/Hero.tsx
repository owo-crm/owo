"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LANDING_CONFIG } from "@/config/landing";

const leadToneClasses: Record<(typeof LANDING_CONFIG.hero.leads)[number]["tone"], string> = {
  new: "bg-emerald-400/16 text-emerald-300",
  active: "bg-[#6b7ff0]/18 text-[#aeb9ff]",
  warning: "bg-amber-400/14 text-amber-300",
  closed: "bg-white/10 text-white/70",
};

export function Hero() {
  return (
    <section id="top" className="px-4 pt-28 sm:px-6 sm:pt-32">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <p className="mb-4 text-sm text-[#8b8d9e]">{LANDING_CONFIG.tagline}</p>
            <h1 className="text-[clamp(2.3rem,6vw,3.5rem)] font-bold leading-[1.1] tracking-tight text-[#e8e9f0]">
              {LANDING_CONFIG.hero.title.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-[1.65] text-[#8b8d9e]">
              {LANDING_CONFIG.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={`#${LANDING_CONFIG.survey.sectionId}`}
                className="inline-flex items-center gap-2 rounded-xl bg-[#6b7ff0] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8b9bf3]"
              >
                {LANDING_CONFIG.hero.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-[#a8b2ff] transition-colors hover:text-[#c0c8ff]"
              >
                {LANDING_CONFIG.hero.secondaryCta}
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_0_60px_rgba(107,127,240,0.12)] sm:p-6"
          >
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#8b8d9e]">
              {LANDING_CONFIG.hero.stats}
            </p>
            <div className="mt-4 space-y-3">
              {LANDING_CONFIG.hero.leads.map((lead, index) => (
                <div
                  key={`${lead.name}-${lead.phone}`}
                  className={`rounded-xl border px-4 py-3 transition-colors ${
                    index === 1
                      ? "border-[#6b7ff0]/50 bg-[#6b7ff0]/12"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#e8e9f0]">{lead.name}</p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${leadToneClasses[lead.tone]}`}
                    >
                      {lead.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#8b8d9e]">{lead.phone}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <p className="mt-8 text-center text-sm text-[#8b8d9e]">{LANDING_CONFIG.hero.trustLine}</p>
      </div>
    </section>
  );
}
