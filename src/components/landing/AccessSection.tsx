"use client";

import { motion } from "framer-motion";
import { Monitor, Send } from "lucide-react";
import type { ReactNode } from "react";
import { LANDING_CONFIG } from "@/config/landing";

export function AccessSection() {
  return (
    <section className="section-alt px-4 py-18 sm:px-6 sm:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="text-[clamp(1.9rem,4vw,2.4rem)] font-semibold tracking-tight text-[#e8e9f0]"
        >
          {LANDING_CONFIG.access.title}
        </motion.h2>

        <div className="mt-8 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]">
          <AccessCard
            icon={<Monitor className="h-5 w-5 text-[#aeb9ff]" />}
            title={LANDING_CONFIG.access.browser.title}
            body={LANDING_CONFIG.access.browser.body}
            delay={0}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.04 }}
            className="hidden items-center justify-center gap-3 px-2 lg:flex"
          >
            <span className="h-px w-8 bg-white/15" />
            <span className="text-sm text-[#8b8d9e]">или</span>
            <span className="h-px w-8 bg-white/15" />
          </motion.div>

          <AccessCard
            icon={<Send className="h-5 w-5 text-[#aeb9ff]" />}
            title={LANDING_CONFIG.access.telegram.title}
            body={LANDING_CONFIG.access.telegram.body}
            delay={0.08}
          />
        </div>
      </div>
    </section>
  );
}

function AccessCard({
  icon,
  title,
  body,
  delay,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  delay: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.45, ease: "easeOut", delay }}
      className="rounded-2xl border border-white/10 bg-white/5 p-6"
    >
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-semibold text-[#e8e9f0]">{title}</h3>
      <p className="mt-3 text-base leading-[1.65] text-[#8b8d9e]">{body}</p>
    </motion.article>
  );
}
