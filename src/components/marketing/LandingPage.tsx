"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BadgeDollarSign,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  ClipboardCheck,
  Database,
  Gauge,
  Layers3,
  LoaderCircle,
  Mail,
  MessageSquareText,
  Radar,
  Rows3,
  ScanSearch,
  Send,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import {
  FaDiscord,
  FaFacebookF,
  FaInstagram,
  FaTelegramPlane,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  developerTelegramHandle,
  initialSurveyState,
  landingContent,
  languageStorageKey,
  surveyStorageKey,
  type LandingLanguage,
  type SurveyFormState,
} from "@/lib/content";

type SubmitState = "idle" | "submitting" | "success" | "error";

type NavItem = {
  label: string;
  href: string;
};

type CurrentCopy = (typeof landingContent)[LandingLanguage];
type WorkflowItem = (typeof landingContent)[LandingLanguage]["workflow"]["items"][number];
type AdvantageItem = (typeof landingContent)[LandingLanguage]["advantages"]["items"][number];
type SecondaryItem =
  (typeof landingContent)[LandingLanguage]["secondaryOps"]["items"][number];
type FooterLink = (typeof landingContent)[LandingLanguage]["footer"]["contacts"][number];
type SurveyStep = (typeof landingContent)[LandingLanguage]["survey"]["steps"][number];

type SurveySectionProps = {
  current: CurrentCopy;
  currentStep: number;
  form: SurveyFormState;
  submitState: SubmitState;
  stepError: string;
  currentSurveyStep: SurveyStep;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onTogglePriority: (value: string) => void;
  onUpdateField: <K extends keyof SurveyFormState>(
    key: K,
    value: SurveyFormState[K],
  ) => void;
};

const surveySteps = [0, 1, 2, 3, 4, 5] as const;

export function LandingPage() {
  const surveyRef = useRef<HTMLElement | null>(null);
  const [language, setLanguage] = useState<LandingLanguage>("en");
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<SurveyFormState>(initialSurveyState);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [stepError, setStepError] = useState("");

  const current = landingContent[language];
  const currentSurveyStep = current.survey.steps[currentStep];

  useEffect(() => {
    try {
      const storedLanguage = window.localStorage.getItem(languageStorageKey);
      const storedSurvey = window.localStorage.getItem(surveyStorageKey);

      if (storedLanguage === "en" || storedLanguage === "pl") {
        setLanguage(storedLanguage);
      }

      if (storedSurvey) {
        setForm({
          ...initialSurveyState,
          ...(JSON.parse(storedSurvey) as Partial<SurveyFormState>),
        });
      }
    } catch {
      // Ignore malformed local state and start fresh.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(languageStorageKey, language);
  }, [language]);

  useEffect(() => {
    window.localStorage.setItem(surveyStorageKey, JSON.stringify(form));
  }, [form]);

  function scrollToSurvey() {
    surveyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function updateField<K extends keyof SurveyFormState>(
    key: K,
    value: SurveyFormState[K],
  ) {
    setForm((currentState) => ({ ...currentState, [key]: value }));
    setStepError("");
  }

  function togglePriority(value: string) {
    setForm((currentState) => {
      const exists = currentState.featurePriorities.includes(value);

      return {
        ...currentState,
        featurePriorities: exists
          ? currentState.featurePriorities.filter((item) => item !== value)
          : [...currentState.featurePriorities, value],
      };
    });
    setStepError("");
  }

  function validateStep(step: number) {
    switch (step) {
      case 0:
        return Boolean(form.businessType && form.teamSize);
      case 1:
        return Boolean(form.currentTools.trim() && form.mainPains.trim());
      case 2:
        return Boolean(
          form.featurePriorities.length > 0 && form.preferredWorkspace,
        );
      case 3:
        return Boolean(
          form.idealLeadCardNotes.trim() && form.preferredStyle.trim(),
        );
      case 4:
        return Boolean(form.willingnessToPay && form.earlyAccessInterest);
      case 5:
        return Boolean(form.name.trim() && form.email.trim() && form.consent);
      default:
        return false;
    }
  }

  function handleNext() {
    if (!validateStep(currentStep)) {
      setStepError(current.survey.required);
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, surveySteps.length - 1));
    setStepError("");
  }

  function handleBack() {
    setCurrentStep((step) => Math.max(step - 1, 0));
    setStepError("");
  }

  async function handleSubmit() {
    if (!validateStep(currentStep)) {
      setStepError(current.survey.required);
      return;
    }

    setSubmitState("submitting");
    setStepError("");

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
          language,
          source: "landing_v1",
          utm,
          contact: {
            name: form.name,
            email: form.email,
            telegram: form.telegram,
            preferredContact: form.preferredContact,
            consentToContact: form.consent,
          },
          survey: {
            businessType: form.businessType,
            teamSize: form.teamSize,
            currentTools: form.currentTools,
            mainPains: form.mainPains,
            featurePriorities: form.featurePriorities,
            preferredWorkspace: form.preferredWorkspace,
            idealLeadCardNotes: form.idealLeadCardNotes,
            preferredStyle: form.preferredStyle,
            willingnessToPay: form.willingnessToPay,
            earlyAccessInterest: form.earlyAccessInterest,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      window.localStorage.removeItem(surveyStorageKey);
      setSubmitState("success");
    } catch {
      setSubmitState("error");
      setStepError(current.survey.submitError);
    }
  }

  const navItems: NavItem[] = [
    { label: current.nav.proof, href: "#proof" },
    { label: current.nav.core, href: "#core" },
    { label: current.nav.survey, href: "#survey" },
  ];

  return (
    <main className="landing-shell">
      <div className="pointer-events-none absolute left-[-8%] top-[-6%] h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(255,91,98,0.2),transparent_68%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-6%] top-[4%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(95,132,255,0.18),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-10%] left-[24%] h-[20rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(255,91,98,0.1),transparent_72%)] blur-3xl" />

      <header className="sticky top-0 z-40 border-b border-white/6 bg-[#090b12]/78 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl min-w-0 items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/6 shadow-[0_10px_30px_rgba(255,91,98,0.16)] sm:h-11 sm:w-11">
              <Image
                src="/owo-logo.png"
                alt="OWO CRM logo"
                width={52}
                height={52}
                priority
                className="h-9 w-9 object-contain sm:h-10 sm:w-10"
              />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="hidden font-display text-[0.68rem] uppercase tracking-[0.28em] text-white/34 sm:block">
                Meta lead automation
              </p>
              <p className="truncate font-display text-base font-semibold text-white sm:text-lg">
                {current.nav.brand}
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-6 text-sm text-white/66 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition-colors duration-200 hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="glass-line hidden rounded-full p-1 sm:flex">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`rounded-full px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.14em] transition ${
                  language === "en"
                    ? "bg-white text-[#090b12]"
                    : "text-white/64 hover:text-white"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("pl")}
                className={`rounded-full px-3 py-1.5 text-[0.7rem] font-semibold tracking-[0.14em] transition ${
                  language === "pl"
                    ? "bg-white text-[#090b12]"
                    : "text-white/64 hover:text-white"
                }`}
              >
                PL
              </button>
            </div>
            <button
              type="button"
              onClick={scrollToSurvey}
              aria-label={current.nav.cta}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff5b62,#ff7867)] px-3 text-[0.8rem] font-semibold text-white shadow-[0_14px_34px_rgba(255,91,98,0.26)] transition hover:translate-y-[-1px] hover:opacity-95 sm:h-auto sm:px-5 sm:py-2.5 sm:text-sm"
            >
              <span className="hidden sm:inline">{current.nav.cta}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <section
        id="top"
        className="relative mx-auto flex min-h-[calc(100svh-72px)] w-full max-w-[1500px] items-center px-4 pb-8 pt-6 sm:px-6 sm:pb-10 lg:px-8 lg:pt-8 xl:min-h-[calc(100svh-78px)]"
      >
        <div className="mx-auto w-full max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative z-10 grid gap-8 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] xl:items-center"
          >
            <div className="max-w-2xl text-left">
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/62">
                {current.hero.eyebrow}
              </p>
              <h1 className="max-w-xl text-balance font-display text-[2.35rem] font-semibold leading-[0.98] text-white sm:text-[3.3rem] lg:text-[4.2rem]">
                {current.hero.title}
              </h1>
              <p className="mt-5 max-w-lg text-[0.98rem] leading-7 text-white/68 sm:text-[1.02rem] sm:leading-8">
                {current.hero.body}
              </p>
            </div>

            <div className="xl:pl-4">
              <HeroActionPanel current={current} onPrimaryClick={scrollToSurvey} />
            </div>
          </motion.div>
        </div>
      </section>

      <section id="proof" className="scroll-mt-24">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-12 sm:px-6 sm:pb-14 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#98aefc]">
              {current.workflow.eyebrow}
            </p>
            {current.workflow.intro ? (
              <p className="mt-3 text-base leading-7 text-white/64 sm:text-lg">
                {current.workflow.intro}
              </p>
            ) : null}
          </div>

          <SnakeFlow items={current.workflow.items} />
        </div>
      </section>

      <section id="core" className="scroll-mt-24">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-12 sm:px-6 sm:pb-14 lg:px-8">
          <SectionHeading
            eyebrow={current.advantages.eyebrow}
            title={current.advantages.title}
            intro={current.advantages.intro}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            {current.advantages.items.map((item, index) => (
              <CoreAdvantage key={item.title} item={item} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-12 sm:px-6 sm:pb-14 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:px-8">
          <SectionHeading
            eyebrow={current.secondaryOps.eyebrow}
            title={current.secondaryOps.title}
            intro={current.secondaryOps.intro}
          />
          <SecondaryOps items={current.secondaryOps.items} />
        </div>
      </section>

      <section id="survey" ref={surveyRef} className="scroll-mt-24">
        <SurveySection
          current={current}
          currentStep={currentStep}
          form={form}
          submitState={submitState}
          stepError={stepError}
          currentSurveyStep={currentSurveyStep}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
          onTogglePriority={togglePriority}
          onUpdateField={updateField}
        />
      </section>

      <FooterSection current={current} />
    </main>
  );
}

function RewardCallout({
  current,
  centered = false,
}: {
  current: CurrentCopy;
  centered?: boolean;
}) {
  return (
    <div
      className={`mt-6 max-w-xl rounded-[26px] border border-[#ff8d93]/18 bg-[linear-gradient(135deg,rgba(255,91,98,0.13),rgba(95,132,255,0.08))] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.18)] ${
        centered ? "mx-auto text-left" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-[#ffb0b4]">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/54">
            {current.hero.reward.eyebrow}
          </p>
          <p className="mt-2 font-display text-xl font-semibold text-white sm:text-2xl">
            {current.hero.reward.title}
          </p>
          <p className="mt-2 text-sm leading-6 text-white/72">
            {current.hero.reward.body}
          </p>
        </div>
      </div>
    </div>
  );
}

function HeroActionPanel({
  current,
  onPrimaryClick,
}: {
  current: CurrentCopy;
  onPrimaryClick: () => void;
}) {
  return (
    <div className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,17,26,0.96),rgba(10,11,18,0.94))] p-5 text-left shadow-[0_24px_64px_rgba(0,0,0,0.22)] sm:p-6">
      <div className="grid gap-3">
        {current.hero.points.map((point) => (
          <div
            key={point}
            className="flex items-start gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3.5"
          >
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ff5b62]/14 text-[#ffadb2]">
              <Check className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm leading-6 text-white/80 sm:text-[0.96rem]">
              {point}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onPrimaryClick}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff5b62,#ff7867)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(255,91,98,0.28)] transition hover:translate-y-[-2px] hover:opacity-95"
        >
          {current.hero.primaryCta}
          <ArrowRight className="h-4 w-4" />
        </button>
        <a
          href="#proof"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3.5 text-sm font-semibold text-white/74 transition hover:border-white/18 hover:text-white"
        >
          {current.hero.secondaryCta}
          <ChevronRight className="h-4 w-4" />
        </a>
      </div>

      <RewardCallout current={current} />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl"
    >
      <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#98aefc]">
        {eyebrow}
      </p>
      <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl lg:text-[2.9rem]">
        {title}
      </h2>
      {intro ? (
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/64 sm:text-lg">
          {intro}
        </p>
      ) : null}
    </motion.div>
  );
}

function SnakeFlow({
  items,
}: {
  items: ReadonlyArray<WorkflowItem>;
}) {
  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {items.map((item, index) => (
          <div
            key={item.badge}
            className="flex flex-col gap-2"
          >
            <SnakeNode item={item} compact />
            {index < items.length - 1 ? (
              <div className="flex items-center justify-center gap-2 py-1 text-[#8da0ff]">
                <span className="h-px w-8 bg-[#8da0ff]/28" />
                <ArrowRight className="h-4 w-4 rotate-90" />
                <span className="h-px w-8 bg-[#8da0ff]/60" />
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="hidden grid-cols-5 gap-3 lg:grid">
        {items.map((item) => (
          <div key={item.badge} className="min-w-0">
            <SnakeNode item={item} compact equal />
          </div>
        ))}
      </div>
    </>
  );
}

function SnakeNode({
  item,
  compact = false,
  equal = false,
}: {
  item: WorkflowItem;
  compact?: boolean;
  equal?: boolean;
}) {
  const icons = [Rows3, Database, ScanSearch, Send, BadgeDollarSign];
  const Icon = icons[Math.max(0, Number(item.badge) - 1)] ?? ClipboardCheck;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4 }}
      className={`flex min-w-0 items-center gap-2.5 rounded-[18px] border border-white/7 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] shadow-[0_10px_28px_rgba(0,0,0,0.12)] ${
        compact
          ? "min-h-[3.7rem] px-3 py-2.5"
          : "min-h-[4.2rem] flex-1 px-3.5 py-3"
      } ${equal ? "h-[4.7rem] w-full" : ""}`}
    >
      <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-[15px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,91,98,0.18),rgba(95,132,255,0.16))] text-white">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-white/40">
          {item.badge}
        </p>
        <p className="mt-0.5 font-display text-[0.95rem] font-semibold text-white sm:text-[1.02rem]">
          {item.title}
        </p>
      </div>
    </motion.div>
  );
}

function CoreAdvantage({
  item,
  index,
}: {
  item: AdvantageItem;
  index: number;
}) {
  const icons = [Layers3, Mail, Workflow];
  const Icon = icons[index] ?? Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: index * 0.05 }}
      className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5 shadow-[0_16px_44px_rgba(0,0,0,0.16)] sm:p-6"
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#ff8d93]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="font-display text-2xl font-semibold text-white">
        {item.title}
      </h3>
      <p className="mt-3 text-base leading-7 text-white/64">{item.body}</p>
    </motion.div>
  );
}

function SecondaryOps({ items }: { items: ReadonlyArray<SecondaryItem> }) {
  const icons = [Gauge, Layers3, Radar];

  return (
    <div className="grid gap-4">
      {items.map((item, index) => {
        const Icon = icons[index] ?? Sparkles;

        return (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: index * 0.05 }}
            className="grid gap-4 rounded-[28px] border border-white/8 bg-white/[0.03] p-5 shadow-[0_16px_44px_rgba(0,0,0,0.14)] sm:grid-cols-[auto_minmax(0,1fr)] sm:p-6"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#94aafd]">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-white/64">{item.body}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function SurveySection({
  current,
  currentStep,
  form,
  submitState,
  stepError,
  currentSurveyStep,
  onBack,
  onNext,
  onSubmit,
  onTogglePriority,
  onUpdateField,
}: SurveySectionProps) {
  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-clip px-4 pb-14 pt-2 sm:px-6 sm:pb-16 lg:px-8">
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-start">
        <div className="min-w-0 space-y-5">
          <div className="max-w-xl">
            <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#98aefc]">
              {current.nav.survey}
            </p>
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              {current.survey.heading}
            </h2>
            <p className="mt-4 hidden text-base leading-7 text-white/66 sm:text-lg lg:block">
              {current.survey.subheading}
            </p>
          </div>

          <SurveyStepRail current={current} currentStep={currentStep} />
        </div>

        <div className="survey-shadow relative min-w-0 max-w-full overflow-x-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,14,21,0.98),rgba(10,11,18,0.98))] p-4 sm:p-5 lg:rounded-[32px] lg:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#5f84ff]/10 via-[#ff5b62]/8 to-transparent" />
          <div className="relative min-w-0 max-w-full overflow-x-hidden">
            <div className="mb-5 flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#98aefc]">
                  {current.survey.progressLabel} {currentStep + 1} /{" "}
                  {current.survey.steps.length}
                </p>
                <h3 className="mt-2 font-display text-[2rem] font-semibold leading-tight text-white sm:mt-3 sm:text-3xl">
                  {currentSurveyStep.title}
                </h3>
                <p className="mt-3 hidden max-w-2xl break-words text-sm leading-6 text-white/64 sm:block sm:text-base sm:leading-7">
                  {currentSurveyStep.description}
                </p>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/44 sm:flex">
                <CircleDashed className="h-4 w-4" />
                {current.survey.saving}
              </div>
            </div>

            <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-white/6">
              <motion.div
                className="h-full rounded-full bg-[linear-gradient(90deg,#ff5b62,#5f84ff)]"
                initial={false}
                animate={{
                  width: `${((currentStep + 1) / current.survey.steps.length) * 100}%`,
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>

            <AnimatePresence mode="wait">
              {submitState === "success" ? (
                <motion.div
                  key="survey-success"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#ff8d93]/22 bg-[linear-gradient(135deg,rgba(255,91,98,0.12),rgba(95,132,255,0.06))] px-4 py-2 text-sm font-semibold text-white">
                    <ShieldCheck className="h-4 w-4 text-[#ffb0b4]" />
                    {current.survey.rewardBadge}
                  </div>
                  <div>
                    <h4 className="font-display text-3xl font-semibold text-white sm:text-4xl">
                      {current.survey.successTitle}
                    </h4>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
                      {current.survey.successBody}
                    </p>
                    <p className="mt-4 max-w-2xl text-sm leading-6 text-white/58 sm:text-base sm:leading-7">
                      {current.survey.successHelper}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <a
                      href={`https://t.me/${developerTelegramHandle.replace("@", "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/4 px-5 py-3.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/6"
                    >
                      <MessageSquareText className="h-4 w-4 text-[#98aefc]" />
                      {current.survey.developerContact}: {developerTelegramHandle}
                    </a>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={`survey-step-${currentStep}`}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.28 }}
                  className="min-w-0 max-w-full space-y-4 overflow-x-hidden sm:space-y-5"
                >
                  {currentStep === 0 ? (
                    <>
                      <SelectField
                        label={current.survey.fields.businessType.label}
                        value={form.businessType}
                        onChange={(value) => onUpdateField("businessType", value)}
                        placeholder={current.survey.fields.businessType.placeholder}
                        options={current.survey.fields.businessType.options}
                      />
                      <SelectField
                        label={current.survey.fields.teamSize.label}
                        value={form.teamSize}
                        onChange={(value) => onUpdateField("teamSize", value)}
                        placeholder={current.survey.fields.teamSize.placeholder}
                        options={current.survey.fields.teamSize.options}
                      />
                    </>
                  ) : null}

                  {currentStep === 1 ? (
                    <>
                      <TextareaField
                        label={current.survey.fields.currentTools.label}
                        value={form.currentTools}
                        onChange={(value) => onUpdateField("currentTools", value)}
                        placeholder={current.survey.fields.currentTools.placeholder}
                      />
                      <TextareaField
                        label={current.survey.fields.mainPains.label}
                        value={form.mainPains}
                        onChange={(value) => onUpdateField("mainPains", value)}
                        placeholder={current.survey.fields.mainPains.placeholder}
                      />
                    </>
                  ) : null}

                  {currentStep === 2 ? (
                    <>
                      <div>
                        <FieldLabel>
                          {current.survey.fields.featurePriorities.label}
                        </FieldLabel>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {current.survey.fields.featurePriorities.options.map(
                            (option) => {
                              const active = form.featurePriorities.includes(
                                option.value,
                              );

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => onTogglePriority(option.value)}
                                  className={`block w-full min-w-0 rounded-[20px] border px-4 py-3.5 text-left transition ${
                                    active
                                      ? "border-[#ff8d93]/34 bg-[#170f18]/78 text-white"
                                      : "border-white/10 bg-white/4 text-white/68 hover:border-white/18 hover:text-white"
                                  }`}
                                >
                                  <span className="text-sm font-semibold">
                                    {option.label}
                                  </span>
                                </button>
                              );
                            },
                          )}
                        </div>
                      </div>
                      <div>
                        <FieldLabel>
                          {current.survey.fields.preferredWorkspace.label}
                        </FieldLabel>
                        <div className="mt-3 grid gap-3">
                          {current.survey.fields.preferredWorkspace.options.map(
                            (option) => {
                              const active =
                                form.preferredWorkspace === option.value;

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() =>
                                    onUpdateField(
                                      "preferredWorkspace",
                                      option.value,
                                    )
                                  }
                                  className={`flex w-full min-w-0 items-center justify-between gap-3 rounded-[20px] border px-4 py-3.5 text-left transition ${
                                    active
                                      ? "border-[#ff8d93]/34 bg-[#170f18]/78 text-white"
                                      : "border-white/10 bg-white/4 text-white/68 hover:border-white/18 hover:text-white"
                                  }`}
                                >
                                  <span className="font-semibold">
                                    {option.label}
                                  </span>
                                  {active ? (
                                    <Check className="h-4 w-4 text-[#ff9ca2]" />
                                  ) : null}
                                </button>
                              );
                            },
                          )}
                        </div>
                      </div>
                    </>
                  ) : null}

                  {currentStep === 3 ? (
                    <>
                      <SelectField
                        label={current.survey.fields.idealLeadCardNotes.label}
                        value={form.idealLeadCardNotes}
                        onChange={(value) =>
                          onUpdateField("idealLeadCardNotes", value)
                        }
                        placeholder={
                          current.survey.fields.idealLeadCardNotes.placeholder
                        }
                        options={current.survey.fields.idealLeadCardNotes.options}
                      />
                      <SelectField
                        label={current.survey.fields.preferredStyle.label}
                        value={form.preferredStyle}
                        onChange={(value) => onUpdateField("preferredStyle", value)}
                        placeholder={current.survey.fields.preferredStyle.placeholder}
                        options={current.survey.fields.preferredStyle.options}
                      />
                    </>
                  ) : null}

                  {currentStep === 4 ? (
                    <>
                      <SelectField
                        label={current.survey.fields.willingnessToPay.label}
                        value={form.willingnessToPay}
                        onChange={(value) =>
                          onUpdateField("willingnessToPay", value)
                        }
                        placeholder={current.survey.fields.willingnessToPay.placeholder}
                        options={current.survey.fields.willingnessToPay.options}
                      />
                      <div>
                        <FieldLabel>
                          {current.survey.fields.earlyAccessInterest.label}
                        </FieldLabel>
                        <div className="mt-3 grid gap-3">
                          {current.survey.fields.earlyAccessInterest.options.map(
                            (option) => {
                              const active =
                                form.earlyAccessInterest === option.value;

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() =>
                                    onUpdateField(
                                      "earlyAccessInterest",
                                      option.value,
                                    )
                                  }
                                  className={`flex w-full min-w-0 items-center justify-between gap-3 rounded-[20px] border px-4 py-3.5 text-left transition ${
                                    active
                                      ? "border-[#ff8d93]/34 bg-[#170f18]/78 text-white"
                                      : "border-white/10 bg-white/4 text-white/68 hover:border-white/18 hover:text-white"
                                  }`}
                                >
                                  <span className="font-semibold">
                                    {option.label}
                                  </span>
                                  {active ? (
                                    <Check className="h-4 w-4 text-[#ff9ca2]" />
                                  ) : null}
                                </button>
                              );
                            },
                          )}
                        </div>
                      </div>
                    </>
                  ) : null}

                  {currentStep === 5 ? (
                    <>
                      <InputField
                        label={current.survey.fields.name.label}
                        value={form.name}
                        onChange={(value) => onUpdateField("name", value)}
                        placeholder={current.survey.fields.name.placeholder}
                      />
                      <InputField
                        label={current.survey.fields.email.label}
                        value={form.email}
                        onChange={(value) => onUpdateField("email", value)}
                        placeholder={current.survey.fields.email.placeholder}
                        type="email"
                      />
                      <InputField
                        label={current.survey.fields.telegram.label}
                        value={form.telegram}
                        onChange={(value) => onUpdateField("telegram", value)}
                        placeholder={current.survey.fields.telegram.placeholder}
                      />
                      <SelectField
                        label={current.survey.fields.preferredContact.label}
                        value={form.preferredContact}
                        onChange={(value) =>
                          onUpdateField("preferredContact", value)
                        }
                        placeholder=""
                        options={current.survey.fields.preferredContact.options}
                      />
                      <label className="flex min-w-0 items-start gap-3 rounded-[20px] border border-white/10 bg-white/4 px-4 py-3.5 text-sm text-white/72">
                        <input
                          type="checkbox"
                          checked={form.consent}
                          onChange={(event) =>
                            onUpdateField("consent", event.target.checked)
                          }
                          className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent text-[#ff5b62] accent-[#ff5b62]"
                        />
                        <span>{current.survey.fields.consent.label}</span>
                      </label>
                    </>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>

            {submitState !== "success" ? (
              <>
                {stepError ? (
                  <p className="mt-6 rounded-[18px] border border-[#ff7d7d]/18 bg-[#ff7d7d]/8 px-4 py-3 text-sm text-[#ffc0c0]">
                    {stepError}
                  </p>
                ) : null}

                <div className="mt-5 flex flex-col gap-3 border-t border-white/8 pt-5 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={onBack}
                    disabled={currentStep === 0}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/70 transition hover:border-white/18 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {current.survey.back}
                  </button>
                  {currentStep < surveySteps.length - 1 ? (
                    <button
                      type="button"
                      onClick={onNext}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#090b12] transition hover:translate-y-[-1px] hover:bg-white/90 sm:w-auto"
                    >
                      {current.survey.next}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onSubmit}
                      disabled={submitState === "submitting"}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff5b62,#ff7867)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_38px_rgba(255,91,98,0.28)] transition hover:translate-y-[-1px] hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                    >
                      {submitState === "submitting" ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4" />
                      )}
                      {current.survey.submit}
                    </button>
                  )}
                </div>

                <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.035] px-4 py-3.5 text-sm leading-6 text-white/58 sm:mt-5">
                  {current.survey.privacy}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function SurveyStepRail({
  current,
  currentStep,
}: {
  current: CurrentCopy;
  currentStep: number;
}) {
  return (
    <>
      <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {current.survey.steps.map((step, index) => (
          <div
            key={step.title}
            className={`min-w-[8.25rem] max-w-[8.25rem] rounded-[18px] border px-3 py-2.5 transition ${
              index === currentStep
                ? "border-[#ff8d93]/34 bg-[#170f18]/72"
                : "border-white/8 bg-white/[0.03]"
            }`}
          >
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/40">
              {current.survey.stepLabel} {index + 1}
            </p>
            <p className="mt-2 line-clamp-2 min-h-[2.8rem] font-display text-base font-semibold leading-5 text-white">
              {step.title}
            </p>
          </div>
        ))}
      </div>

      <div className="hidden gap-2 lg:grid">
        {current.survey.steps.map((step, index) => (
          <div
            key={step.title}
            className={`flex items-center justify-between gap-3 rounded-[22px] border px-4 py-3 transition ${
              index === currentStep
                ? "border-[#ff8d93]/34 bg-[#170f18]/72"
                : "border-white/8 bg-white/[0.03]"
            }`}
          >
            <div className="min-w-0">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-white/40">
                {current.survey.stepLabel} {index + 1}
              </p>
              <p className="mt-1 truncate font-display text-lg font-semibold text-white">
                {step.title}
              </p>
            </div>
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                index <= currentStep
                  ? "border-[#ff8d93]/34 bg-[#ff5b62]/12 text-[#ffb0b4]"
                  : "border-white/10 bg-white/4 text-white/42"
              }`}
            >
              {index < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-xs font-semibold">{index + 1}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function FooterSection({ current }: { current: CurrentCopy }) {
  const socialIcons: Record<string, ReactNode> = {
    Facebook: <FaFacebookF className="h-4 w-4" />,
    Instagram: <FaInstagram className="h-4 w-4" />,
    TikTok: <FaTiktok className="h-4 w-4" />,
    YouTube: <FaYoutube className="h-4 w-4" />,
    Discord: <FaDiscord className="h-4 w-4" />,
    Telegram: <FaTelegramPlane className="h-4 w-4" />,
  };

  return (
    <footer className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(14,15,24,0.98),rgba(10,11,18,0.96))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-start">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/6">
                <Image
                  src="/owo-logo.png"
                  alt="OWO CRM logo"
                  width={52}
                  height={52}
                  className="h-10 w-10 object-contain"
                />
              </div>
              <div>
                <p className="font-display text-xl font-semibold text-white">
                  {current.nav.brand}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              {current.footer.contacts.map((item) => (
                <FooterLinkRow key={item.label} item={item} />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 lg:justify-end">
              {current.footer.socials.map((item) =>
                "href" in item && item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={item.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/76 transition hover:border-white/18 hover:text-white"
                >
                  {socialIcons[item.label] ?? <ChevronRight className="h-4 w-4" />}
                </a>
                ) : (
                <span
                  key={item.label}
                  aria-label={item.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.02] text-white/40"
                >
                  {socialIcons[item.label] ?? <ChevronRight className="h-4 w-4" />}
                </span>
                ),
              )}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLinkRow({ item }: { item: FooterLink }) {
  const content = (
    <>
      <p className="text-xs uppercase tracking-[0.2em] text-white/38">
        {item.label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
    </>
  );

  if (item.href) {
    return (
      <a
        href={item.href}
        target={item.href.startsWith("#") ? undefined : "_blank"}
        rel={item.href.startsWith("#") ? undefined : "noreferrer"}
        className="block rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3 transition hover:border-white/16 hover:bg-white/[0.05]"
      >
        {content}
      </a>
    );
  }

  return (
    <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3">
      {content}
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold tracking-[0.01em] text-white/84">
      {children}
    </label>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="min-w-0 max-w-full">
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-3 block w-full min-w-0 max-w-full rounded-[20px] border border-white/10 bg-white/4 px-4 py-3.5 text-white outline-none transition placeholder:text-white/30 focus:border-[#ff8d93]/40 focus:bg-[#17111a]"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="min-w-0 max-w-full">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-3 block min-h-[132px] w-full min-w-0 max-w-full rounded-[20px] border border-white/10 bg-white/4 px-4 py-3.5 text-white outline-none transition placeholder:text-white/30 focus:border-[#ff8d93]/40 focus:bg-[#17111a]"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <div className="min-w-0 max-w-full">
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 block w-full min-w-0 max-w-full rounded-[20px] border border-white/10 bg-white/4 px-4 py-3.5 text-white outline-none transition focus:border-[#ff8d93]/40 focus:bg-[#17111a]"
      >
        {placeholder ? (
          <option value="" className="bg-[#0b0f1a] text-white/60">
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-[#0b0f1a] text-white"
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
