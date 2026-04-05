"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import { getSurveyFormConfig, type SurveyUiFieldKey } from "@/config/survey-form";
import { getSurveyI18n } from "@/config/survey-i18n";
import type { Locale } from "@/lib/i18n";

type SubmitState = "idle" | "submitting" | "success" | "error";

type SurveyState = {
  businessType: string;
  teamSize: string;
  mainPain: string;
  currentToolStack: string;
  primaryPriority: string;
  preferredWorkspace: string;
  willingnessToPay: string;
  earlyAccessInterest: string;
  acquisitionChannel: string;
  acquisitionOtherText: string;
  name: string;
  email: string;
  telegram: string;
  preferredContact: string;
  consent: boolean;
};

const STORAGE_KEY = "owo-landing-survey-v2";

const initialState: SurveyState = {
  businessType: "",
  teamSize: "",
  mainPain: "",
  currentToolStack: "",
  primaryPriority: "",
  preferredWorkspace: "",
  willingnessToPay: "",
  earlyAccessInterest: "",
  acquisitionChannel: "",
  acquisitionOtherText: "",
  name: "",
  email: "",
  telegram: "",
  preferredContact: "",
  consent: false,
};

function isFieldRequired(field: SurveyUiFieldKey, state: SurveyState) {
  if (field === "acquisitionOtherText") {
    return state.acquisitionChannel === "other";
  }
  if (field === "telegram") {
    return false;
  }
  return true;
}

export function SurveySection({
  sectionId,
  initialLocale,
}: {
  sectionId: string;
  initialLocale: Locale;
}) {
  const [step, setStep] = useState(0);
  const [locale] = useState<Locale>(initialLocale);
  const [state, setState] = useState<SurveyState>(initialState);
  const [error, setError] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const i18n = getSurveyI18n(locale);
  const formConfig = getSurveyFormConfig(locale);
  const currentStep = formConfig.steps[step];
  const totalSteps = formConfig.steps.length;
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
    const requiredFields = currentStep.requiredFields ?? currentStep.fields;
    return requiredFields.every((field) => {
      if (!isFieldRequired(field, state)) {
        return true;
      }

      const value = state[field];
      if (typeof value === "boolean") return value;
      return value.trim().length > 0;
    });
  }, [currentStep.fields, currentStep.requiredFields, state]);

  function setField<K extends keyof SurveyState>(key: K, value: SurveyState[K]) {
    setState((prev) => {
      if (key === "acquisitionChannel" && value !== "other") {
        return {
          ...prev,
          acquisitionChannel: String(value),
          acquisitionOtherText: "",
        };
      }

      return { ...prev, [key]: value };
    });
    setError("");
  }

  function next() {
    if (!requiredOk) {
      setError(i18n.requiredError);
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
      setError(i18n.requiredError);
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

      utm.acquisition_channel = state.acquisitionChannel;
      if (state.acquisitionChannel === "other" && state.acquisitionOtherText.trim()) {
        utm.acquisition_other = state.acquisitionOtherText.trim();
      }

      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: locale,
          source: "landing_survey_v2_qualification",
          utm,
          contact: {
            name: state.name,
            email: state.email,
            telegram: state.telegram,
            preferredContact: state.preferredContact || "email",
            consentToContact: state.consent,
          },
          survey: {
            businessType: state.businessType,
            teamSize: state.teamSize,
            currentTools: state.currentToolStack,
            mainPains: state.mainPain,
            featurePriorities: state.primaryPriority ? [state.primaryPriority] : [],
            preferredWorkspace: state.preferredWorkspace,
            idealLeadCardNotes: "not_collected_v2",
            preferredStyle: "balanced",
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
      setError(i18n.submitError);
    }
  }

  return (
    <section id={sectionId} className="section-alt px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl border border-white/12 bg-[linear-gradient(145deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] p-4 sm:p-7"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#6b7ff0]/18 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-[#ff5f66]/12 blur-3xl" />

          <p className="text-[11px] uppercase tracking-[0.2em] text-[#a7b7ff] sm:text-xs">Early Access Survey</p>
          <h2 className="text-[clamp(1.9rem,4vw,2.4rem)] font-semibold tracking-tight text-[#e8e9f0]">
            {i18n.title}
          </h2>
          <p className="mt-2 text-sm leading-[1.6] text-[#a1a8c4] sm:mt-3 sm:text-base sm:leading-[1.65]">
            {i18n.subtitle}
          </p>

          {submitState === "success" ? (
            <div className="mt-5 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-4 sm:mt-6">
              <p className="text-lg font-semibold text-emerald-200">{i18n.successTitle}</p>
              <p className="mt-2 text-sm text-emerald-100/90">{i18n.successBody}</p>
            </div>
          ) : (
            <>
              <div className="mt-5 sm:mt-6">
                <p className="text-xs text-[#aab0cb] sm:text-sm">
                  {i18n.stepLabel} {step + 1}/{totalSteps}:{" "}
                  {i18n.stepTitles[step] ?? currentStep.id}
                </p>
                <div className="mt-2 h-2 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#ff5f66] via-[#8ea3ff] to-[#6b7ff0] transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-5 gap-1.5 sm:gap-2">
                  {formConfig.steps.map((_, idx) => (
                    <div
                      key={`step-dot-${idx}`}
                      className={[
                        "h-1.5 rounded-full transition-all",
                        idx < step
                          ? "bg-[#8ea3ff]"
                          : idx === step
                            ? "bg-gradient-to-r from-[#ff5f66] to-[#6b7ff0]"
                            : "bg-white/12",
                      ].join(" ")}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-5 space-y-3.5 sm:mt-6 sm:space-y-4">
                {renderFields(currentStep.fields, state, setField, i18n.consentLabel, formConfig)}
              </div>

              {error ? <p className="mt-3 text-sm text-rose-300 sm:mt-4">{error}</p> : null}

              <div className="sticky bottom-0 z-10 -mx-4 mt-5 border-t border-white/10 bg-[#0d111d]/90 px-4 pb-[calc(0.8rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:m-0 sm:border-0 sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-0">
                <div className="flex flex-wrap items-center gap-2.5 sm:mt-6 sm:gap-3">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 0}
                    className="rounded-lg border border-white/15 px-3.5 py-2 text-sm text-[#d4d8ea] transition hover:border-white/30 disabled:opacity-40 sm:px-4"
                >
                  {i18n.back}
                </button>

                {step < totalSteps - 1 ? (
                  <button
                    type="button"
                    onClick={next}
                      className="rounded-lg bg-gradient-to-r from-[#ff5f66] to-[#6b7ff0] px-3.5 py-2 text-sm font-medium text-white transition hover:brightness-110 sm:px-4"
                  >
                    {i18n.next}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitState === "submitting"}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#ff5f66] to-[#6b7ff0] px-3.5 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-70 sm:px-4"
                  >
                    {submitState === "submitting" ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : null}
                    {i18n.submit}
                  </button>
                )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function renderFields(
  fields: ReadonlyArray<SurveyUiFieldKey>,
  state: SurveyState,
  setField: <K extends keyof SurveyState>(key: K, value: SurveyState[K]) => void,
  consentLabel: string,
  formConfig: ReturnType<typeof getSurveyFormConfig>,
) {
  const definitions = formConfig.fieldDefinitions;

  return fields.map((field) => {
    if (field === "acquisitionOtherText" && state.acquisitionChannel !== "other") {
      return null;
    }

      if (field === "consent") {
      return (
        <label
          key={field}
          className="flex items-start gap-3 rounded-xl border border-white/12 bg-white/4 p-3"
        >
          <input
            type="checkbox"
            checked={state.consent}
            onChange={(event) => setField("consent", event.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[#6b7ff0]"
          />
          <span className="text-sm text-[#d6dbef]">{consentLabel}</span>
        </label>
      );
    }

    const def = definitions[field as Exclude<SurveyUiFieldKey, "consent">];
    if (!def) return null;

    if (def.type === "input") {
      return (
        <div key={field}>
          <label className="mb-1.5 block text-sm text-[#d6dbef] sm:mb-2">{def.label}</label>
          <input
            type={def.inputType ?? "text"}
            value={String(state[field] ?? "")}
            onChange={(event) => setField(field, event.target.value as never)}
            placeholder={def.placeholder}
            className="w-full rounded-xl border border-white/12 bg-[#11131d] px-3.5 py-3 text-sm text-white placeholder:text-[#7f8398] outline-none transition focus:border-[#8ea3ff]/75 focus:bg-[#131728]"
          />
        </div>
      );
    }

    return (
      <div key={field}>
        <label className="mb-1.5 block text-sm text-[#d6dbef] sm:mb-2">{def.label}</label>
        <select
          value={String(state[field] ?? "")}
          onChange={(event) => setField(field, event.target.value as never)}
          className="w-full rounded-xl border border-white/12 bg-[#11131d] px-3.5 py-3 text-sm text-white outline-none transition focus:border-[#8ea3ff]/75 focus:bg-[#131728]"
        >
          <option value="">{def.placeholder}</option>
          {def.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  });
}
