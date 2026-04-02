"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  Calendar,
  Camera,
  Dumbbell,
  Scissors,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { LANDING_CONFIG } from "@/config/landing";

const iconMap: Record<string, LucideIcon> = {
  Briefcase,
  Camera,
  Calendar,
  Scissors,
  Dumbbell,
  ShoppingBag,
};

export function UseCases() {
  return (
    <section className="px-4 py-18 sm:px-6 sm:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="max-w-3xl text-[clamp(1.9rem,4vw,2.4rem)] font-semibold tracking-tight text-[#e8e9f0]"
        >
          {LANDING_CONFIG.useCases.title}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {LANDING_CONFIG.useCases.items.map((item) => {
            const Icon = iconMap[item.icon] ?? Briefcase;

            return (
              <div
                key={item.label}
                className="inline-flex items-center gap-2 rounded-xl border border-[#6b7ff0]/25 bg-[#6b7ff0]/10 px-4 py-3 text-sm text-[#a0aaff]"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
