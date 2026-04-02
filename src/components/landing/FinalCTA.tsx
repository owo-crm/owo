"use client";

import { motion } from "framer-motion";
import { LANDING_CONFIG } from "@/config/landing";

export function FinalCTA() {
  return (
    <section className="px-4 py-18 sm:px-6 sm:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-3xl border border-white/10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(107,127,240,0.14)_0%,transparent_65%),#0d0e15] px-6 py-10 text-center sm:px-10"
        >
          <h2 className="text-[clamp(1.9rem,4vw,2.4rem)] font-semibold tracking-tight text-[#e8e9f0]">
            {LANDING_CONFIG.finalCta.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-[1.65] text-[#8b8d9e]">
            {LANDING_CONFIG.finalCta.subtitle}
          </p>
          <a
            href={`#${LANDING_CONFIG.survey.sectionId}`}
            className="mt-7 inline-flex rounded-xl bg-[#6b7ff0] px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#8b9bf3]"
          >
            {LANDING_CONFIG.finalCta.button}
          </a>
          <p className="mt-4 text-sm text-[#8b8d9e]">{LANDING_CONFIG.finalCta.note}</p>
        </motion.div>
      </div>
    </section>
  );
}
