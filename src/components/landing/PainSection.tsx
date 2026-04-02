"use client";

import { motion } from "framer-motion";
import { BarChart2, Mail, TableProperties, type LucideIcon } from "lucide-react";
import { LANDING_CONFIG } from "@/config/landing";

const iconMap: Record<string, LucideIcon> = {
  TableProperties,
  Mail,
  BarChart2,
};

export function PainSection() {
  return (
    <section className="px-4 py-18 sm:px-6 sm:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="text-[clamp(1.9rem,4vw,2.4rem)] font-semibold tracking-tight text-[#e8e9f0]"
        >
          {LANDING_CONFIG.pain.title}
        </motion.h2>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {LANDING_CONFIG.pain.cards.map((card, index) => {
            const Icon = iconMap[card.icon] ?? TableProperties;

            return (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-7 transition-transform duration-200 hover:-translate-y-0.5 hover:border-[#6b7ff0]/40"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <Icon className="h-5 w-5 text-[#aeb9ff]" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-[#e8e9f0]">{card.title}</h3>
                <p className="mt-3 text-base leading-[1.65] text-[#8b8d9e]">{card.body}</p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
