"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import { LANDING_CONFIG } from "@/config/landing";

type SubmitState = "idle" | "submitting" | "success" | "error";

type SurveyState = {
  businessType: string;
  teamSize: string;
  currentTools: string;
  mainPains: string;
  featurePriorities: string[];
  preferredWorkspace: string;
  idealLeadCardNotes: string;
  preferredStyle: string;
  willingnessToPay: string;
  earlyAccessInterest: string;
  name: string;
  email: string;
  telegram: string;
  preferredContact: string;
  consent: boolean;
};

const STORAGE_KEY = "owo-landing-survey-v1";

const initialState: SurveyState = {
  businessType: "",
  teamSize: "",
  currentTools: "",
  mainPains: "",
  featurePriorities: [],
  preferredWorkspace: "",
  idealLeadCardNotes: "",
  preferredStyle: "",
  willingnessToPay: "",
  earlyAccessInterest: "",
  name: "",
  email: "",
  telegram: "",
  preferredContact: "",
  consent: false,
};

export function SurveySection() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<SurveyState>(initialState);
  const [error, setError] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const config = LANDING_CONFIG.survey;
  const currentStep = config.steps[step];
  const totalSteps = config.steps.length;
  const progress = ((step + 1) / totalSteps) * 100;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SurveyState>;
      setState((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const requiredOk = useMemo(() => {
    const required = currentStep.fields;
    return required.every((field) => {
      const value = state[field];
      if (typeof value === "boolean") return value;
      if (Array.isArray(value)) return value.length > 0;
      return value.trim().length > 0;
    });
  }, [currentStep.fields, state]);

  function setField<K extends keyof SurveyState>(key: K, value: SurveyState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
    setError("");
  }

  function togglePriority(value: string) {
    setState((prev) => {
      const exists = prev.featurePriorities.includes(value);
      return {
        ...prev,
        featurePriorities: exists
          ? prev.featurePriorities.filter((item) => item !== value)
          : [...prev.featurePriorities, value],
      };
    });
  }

  function next() {
    if (!requiredOk) {
      setError(config.requiredError);
      return;
    }
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
    setError("");
  }

  function back() {
    setStep((prev) => Math.max(prev - 1, 0));
    setError("");
  }

  async function submit() {
    if (!requiredOk) {
      setError(config.requiredError);
      return;
    }

    setSubmitState("submitting");
    setError("");

    try {
      const params = new URLSearchParams(window.location.search);
      const utm = Object.fromEntries(
        ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]
          .map((key) => [key, params.get(key) ?? ""])
          .filter(([, value]) => value),
      );

      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: "ru",
          source: "landing_spec_v2",
          utm,
          contact: {
            name: state.name,
            email: state.email,
            telegram: state.telegram,
            preferredContact: state.preferredContact || "telegram",
            consentToContact: state.consent,
          },
          survey: {
            businessType: state.businessType,
            teamSize: state.teamSize,
            currentTools: state.currentTools,
            mainPains: state.mainPains,
            featurePriorities: state.featurePriorities,
            preferredWorkspace: state.preferredWorkspace,
            idealLeadCardNotes: state.idealLeadCardNotes,
            preferredStyle: state.preferredStyle,
            willingnessToPay: state.willingnessToPay,
            earlyAccessInterest: state.earlyAccessInterest,
          },
        }),
      });

      if (!response.ok) throw new Error("Submission failed");

      window.localStorage.removeItem(STORAGE_KEY);
      setSubmitState("success");
    } catch {
      setSubmitState("error");
      setError(config.submitError);
    }
  }

  return (
    <section id={config.sectionId} className="section-alt px-4 py-18 sm:px-6 sm:py-20">
      <div className="mx-auto w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-7"
        >
          <h2 className="text-[clamp(1.9rem,4vw,2.4rem)] font-semibold tracking-tight text-[#e8e9f0]">
            {config.title}
          </h2>
          <p className="mt-3 text-base leading-[1.65] text-[#8b8d9e]">{config.subtitle}</p>

          {submitState === "success" ? (
            <div className="mt-6 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4">
              <p className="text-lg font-semibold text-emerald-200">{config.successTitle}</p>
              <p className="mt-2 text-sm text-emerald-100/90">{config.successBody}</p>
            </div>
          ) : (
            <>
              <div className="mt-6">
                <p className="text-sm text-[#aab0cb]">
                  {config.stepLabel} {step + 1}/{totalSteps}: {currentStep.title}
                </p>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#6b7ff0] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 space-y-4">{renderFields(currentStep.fields, state, setField, togglePriority)}</div>

              {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 0}
                  className="rounded-lg border border-white/15 px-4 py-2 text-sm text-[#d4d8ea] disabled:opacity-40"
                >
                  {config.back}
                </button>

                {step < totalSteps - 1 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="rounded-lg bg-[#6b7ff0] px-4 py-2 text-sm font-medium text-white hover:bg-[#8b9bf3]"
                  >
                    {config.next}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitState === "submitting"}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#6b7ff0] px-4 py-2 text-sm font-medium text-white hover:bg-[#8b9bf3] disabled:opacity-70"
                  >
                    {submitState === "submitting" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                    {config.submit}
                  </button>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function renderFields(
  fields: ReadonlyArray<keyof SurveyState>,
  state: SurveyState,
  setField: <K extends keyof SurveyState>(key: K, value: SurveyState[K]) => void,
  togglePriority: (value: string) => void,
) {
  const definitions = LANDING_CONFIG.survey.fields;

  return fields.map((field) => {
    if (field === "consent") {
      return (
        <label key={field} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/4 p-3">
          <input
            type="checkbox"
            checked={state.consent}
            onChange={(event) => setField("consent", event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#6b7ff0]"
          />
          <span className="text-sm text-[#d6dbef]">{LANDING_CONFIG.survey.consentLabel}</span>
        </label>
      );
    }

    const def = definitions[field as keyof typeof definitions];
    if (!def) return null;

    if (def.type === "input") {
      return (
        <div key={field}>
          <label className="mb-2 block text-sm text-[#d6dbef]">{def.label}</label>
          <input
            type={"inputType" in def && def.inputType ? def.inputType : "text"}
            value={String(state[field] ?? "")}
            onChange={(event) => setField(field, event.target.value as never)}
            placeholder={def.placeholder}
            className="w-full rounded-xl border border-white/10 bg-[#11131d] px-3.5 py-3 text-sm text-white placeholder:text-[#7f8398] outline-none focus:border-[#6b7ff0]/70"
          />
        </div>
      );
    }

    if (def.type === "textarea") {
      return (
        <div key={field}>
          <label className="mb-2 block text-sm text-[#d6dbef]">{def.label}</label>
          <textarea
            value={String(state[field] ?? "")}
            onChange={(event) => setField(field, event.target.value as never)}
            placeholder={def.placeholder}
            className="min-h-24 w-full rounded-xl border border-white/10 bg-[#11131d] px-3.5 py-3 text-sm text-white placeholder:text-[#7f8398] outline-none focus:border-[#6b7ff0]/70"
          />
        </div>
      );
    }

    if (def.type === "select") {
      return (
        <div key={field}>
          <label className="mb-2 block text-sm text-[#d6dbef]">{def.label}</label>
          <select
            value={String(state[field] ?? "")}
            onChange={(event) => setField(field, event.target.value as never)}
            className="w-full rounded-xl border border-white/10 bg-[#11131d] px-3.5 py-3 text-sm text-white outline-none focus:border-[#6b7ff0]/70"
          >
            <option value="">{def.placeholder}</option>
            {"options" in def && def.options
              ? def.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))
              : null}
          </select>
        </div>
      );
    }

    if (def.type === "multi") {
      return (
        <div key={field}>
          <p className="mb-2 block text-sm text-[#d6dbef]">{def.label}</p>
          <div className="grid gap-2">
            {"options" in def && def.options
              ? def.options.map((option) => {
                  const active = state.featurePriorities.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => togglePriority(option.value)}
                      className={`rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${
                        active
                          ? "border-[#6b7ff0]/55 bg-[#6b7ff0]/15 text-white"
                          : "border-white/10 bg-[#11131d] text-[#d6dbef] hover:border-[#6b7ff0]/40"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })
              : null}
          </div>
        </div>
      );
    }

    return null;
  });
}
