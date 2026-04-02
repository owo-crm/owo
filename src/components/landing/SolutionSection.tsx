"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Database,
  Mail,
  MessageSquareText,
  PenLine,
  Rows3,
  Send,
} from "lucide-react";
import { LANDING_CONFIG } from "@/config/landing";

type Feature = (typeof LANDING_CONFIG.solution.features)[number];

function FeatureVisual({ feature }: { feature: Feature }) {
  if (feature.kind === "import") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="rounded-xl border border-white/10 bg-[#0f1018] p-3">
            <div className="space-y-2 text-xs text-[#8b8d9e]">
              <div className="flex items-center gap-2">
                <Rows3 className="h-3.5 w-3.5 text-[#aeb9ff]" />
                <span>Google Sheet</span>
              </div>
              <div className="h-1.5 rounded bg-white/10" />
              <div className="h-1.5 w-5/6 rounded bg-white/10" />
              <div className="h-1.5 w-3/4 rounded bg-white/10" />
            </div>
          </div>
          <ArrowRight className="mx-auto h-5 w-5 text-[#8ea0ff]" />
          <div className="rounded-xl border border-[#6b7ff0]/35 bg-[#6b7ff0]/10 p-3">
            <div className="space-y-2 text-xs text-[#d3d8ff]">
              <div className="flex items-center gap-2">
                <Database className="h-3.5 w-3.5" />
                <span>OWO CRM Leads</span>
              </div>
              <div className="h-1.5 rounded bg-[#8ea0ff]/30" />
              <div className="h-1.5 w-5/6 rounded bg-[#8ea0ff]/30" />
              <div className="h-1.5 w-3/4 rounded bg-[#8ea0ff]/30" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (feature.kind === "email") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <div className="rounded-xl border border-white/10 bg-[#0f1018] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 text-sm text-[#e8e9f0]">
              <Mail className="h-4 w-4 text-[#8ea0ff]" />
              <span>Письмо клиенту</span>
            </div>
            <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs text-emerald-300">
              Отправлено
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#8b8d9e]">
            Здравствуйте, Анна. Ваша заявка принята, менеджер уже назначен.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="rounded-xl border border-white/10 bg-[#0f1018] p-4">
        <div className="grid grid-cols-3 items-center gap-3">
          <SourcePill icon={<Database className="h-3.5 w-3.5" />} label="Sheet" />
          <SourcePill icon={<MessageSquareText className="h-3.5 w-3.5" />} label="Форма" />
          <SourcePill icon={<PenLine className="h-3.5 w-3.5" />} label="Вручную" />
        </div>
        <div className="mt-3 flex items-center justify-center gap-3 text-[#8ea0ff]">
          <ArrowRight className="h-4 w-4" />
          <ArrowRight className="h-4 w-4" />
          <ArrowRight className="h-4 w-4" />
        </div>
        <div className="mt-3 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#6b7ff0]/35 bg-[#6b7ff0]/10 px-3 py-1.5 text-xs text-[#d5dbff]">
            <Send className="h-3.5 w-3.5" />
            <span>Единая воронка OWO CRM</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SourcePill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-[#8b8d9e]">
      {icon}
      <span>{label}</span>
    </div>
  );
}

export function SolutionSection() {
  return (
    <section id="solution" className="section-alt px-4 py-18 sm:px-6 sm:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <h2 className="text-[clamp(1.9rem,4vw,2.4rem)] font-semibold tracking-tight text-[#e8e9f0]">
            {LANDING_CONFIG.solution.title}
          </h2>
          <p className="mt-4 text-base leading-[1.65] text-[#8b8d9e]">
            {LANDING_CONFIG.solution.subtitle}
          </p>
        </motion.div>

        <div className="mt-10 space-y-9">
          {LANDING_CONFIG.solution.features.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="grid items-center gap-6 lg:grid-cols-2"
            >
              <div className={index % 2 === 0 ? "order-1" : "order-1 lg:order-2"}>
                <h3 className="text-xl font-semibold text-[#e8e9f0] sm:text-2xl">{feature.title}</h3>
                <p className="mt-3 text-base leading-[1.65] text-[#8b8d9e]">{feature.body}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-[#a8b2ff]">
                  <span>{feature.note}</span>
                  {"badge" in feature && feature.badge ? (
                    <span className="rounded-full border border-[#6b7ff0]/35 bg-[#6b7ff0]/12 px-2 py-0.5 text-xs">
                      {feature.badge}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className={index % 2 === 0 ? "order-2" : "order-2 lg:order-1"}>
                <FeatureVisual feature={feature} />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
