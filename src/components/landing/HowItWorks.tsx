"use client";

import { motion } from "framer-motion";
import { LANDING_CONFIG } from "@/config/landing";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-18 sm:px-6 sm:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="text-[clamp(1.9rem,4vw,2.4rem)] font-semibold tracking-tight text-[#e8e9f0]"
        >
          {LANDING_CONFIG.howItWorks.title}
        </motion.h2>

        <div className="relative mt-10">
          <div className="pointer-events-none absolute left-0 right-0 top-1/2 hidden -translate-y-1/2 border-t border-dashed border-[#6b7ff0]/35 lg:block" />
          <div className="grid gap-4 lg:grid-cols-3">
            {LANDING_CONFIG.howItWorks.steps.map((step, index) => (
              <motion.article
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, ease: "easeOut", delay: index * 0.05 }}
                className="relative rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <span className="pointer-events-none absolute right-4 top-2 text-[4.6rem] font-bold leading-none text-[#6b7ff0]/18">
                  {step.id}
                </span>
                <h3 className="relative z-10 text-xl font-semibold text-[#e8e9f0]">{step.title}</h3>
                <p className="relative z-10 mt-3 text-base leading-[1.65] text-[#8b8d9e]">
                  {step.body}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
