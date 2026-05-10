import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import type { FormEvent } from "react";
import type { LandingCopy } from "@/components/manus/landing-copy";

type FormState = "idle" | "submitting" | "success";

const fontSans = "var(--font-public-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontHeading = "var(--font-metrophobic), var(--font-public-sans), sans-serif";
const fontMono = "var(--font-public-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

type EarlyAccessSectionProps = {
  copy: LandingCopy["earlyAccess"];
};

export default function EarlyAccessSection({ copy }: EarlyAccessSectionProps) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    teamSize: "",
    painPoint: "",
  });
  const [formState, setFormState] = useState<FormState>("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setFormState("submitting");
    await new Promise((r) => setTimeout(r, 1200));
    setFormState("success");
  };

  return (
    <section id="early-access" className="relative py-24 md:py-32" style={{ background: "#030303" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "rgba(255,255,255,0.06)" }} />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "700px",
          height: "500px",
          background: "radial-gradient(ellipse, rgba(99,102,241,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="text-center mb-10"
          >
            <p className="section-label mb-4">{copy.sectionLabel}</p>
            <h2
              style={{
                fontFamily: fontHeading,
                fontWeight: 700,
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                color: "rgba(255,255,255,0.9)",
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                marginBottom: "1rem",
              }}
            >
              {copy.heading} <span className="gradient-text">{copy.headingHighlight}</span>
            </h2>
            <p
              style={{
                fontFamily: fontSans,
                fontWeight: 300,
                fontSize: "0.95rem",
                color: "rgba(255,255,255,0.4)",
                lineHeight: 1.65,
              }}
            >
              {copy.description}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, delay: 0.1 }}
          >
            {formState === "success" ? (
              <div className="glass-card rounded-2xl p-10 text-center" style={{ border: "1px solid rgba(99,102,241,0.2)" }}>
                <CheckCircle2 size={40} style={{ color: "rgba(99,102,241,0.8)", margin: "0 auto 1rem" }} />
                <h3
                  style={{
                    fontFamily: fontHeading,
                    fontWeight: 700,
                    fontSize: "1.25rem",
                    color: "rgba(255,255,255,0.9)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {copy.successTitle}
                </h3>
                <p
                  style={{
                    fontFamily: fontSans,
                    fontWeight: 300,
                    fontSize: "0.9rem",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  {copy.successBodyPrefix} <strong style={{ color: "rgba(255,255,255,0.65)" }}>{form.email}</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-7 md:p-10 flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="name"
                      style={{
                        fontFamily: fontMono,
                        fontSize: "0.65rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      {copy.labels.name}
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={copy.placeholders.name}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "0.5rem",
                        padding: "0.65rem 0.85rem",
                        fontFamily: fontSans,
                        fontWeight: 300,
                        fontSize: "0.9rem",
                        color: "rgba(255,255,255,0.8)",
                        outline: "none",
                        transition: "border-color 0.2s ease",
                        width: "100%",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.5)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="email"
                      style={{
                        fontFamily: fontMono,
                        fontSize: "0.65rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      {copy.labels.email}
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder={copy.placeholders.email}
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "0.5rem",
                        padding: "0.65rem 0.85rem",
                        fontFamily: fontSans,
                        fontWeight: 300,
                        fontSize: "0.9rem",
                        color: "rgba(255,255,255,0.8)",
                        outline: "none",
                        transition: "border-color 0.2s ease",
                        width: "100%",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.5)")}
                      onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="teamSize"
                    style={{
                      fontFamily: fontMono,
                      fontSize: "0.65rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    {copy.labels.teamSize}
                  </label>
                  <select
                    id="teamSize"
                    value={form.teamSize}
                    onChange={(e) => setForm({ ...form, teamSize: e.target.value })}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "0.5rem",
                      padding: "0.65rem 0.85rem",
                      fontFamily: fontSans,
                      fontWeight: 300,
                      fontSize: "0.9rem",
                      color: form.teamSize ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
                      outline: "none",
                      width: "100%",
                      appearance: "none",
                    }}
                  >
                    <option value="" disabled>{copy.placeholders.teamSize}</option>
                    {copy.teamSizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="painPoint"
                    style={{
                      fontFamily: fontMono,
                      fontSize: "0.65rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    {copy.labels.painPoint}
                  </label>
                  <textarea
                    id="painPoint"
                    rows={3}
                    value={form.painPoint}
                    onChange={(e) => setForm({ ...form, painPoint: e.target.value })}
                    placeholder={copy.placeholders.painPoint}
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "0.5rem",
                      padding: "0.65rem 0.85rem",
                      fontFamily: fontSans,
                      fontWeight: 300,
                      fontSize: "0.9rem",
                      color: "rgba(255,255,255,0.8)",
                      outline: "none",
                      resize: "vertical",
                      width: "100%",
                      transition: "border-color 0.2s ease",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(99,102,241,0.5)")}
                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={formState === "submitting"}
                  style={{
                    background: formState === "submitting" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "0.5rem",
                    padding: "0.8rem 1.5rem",
                    fontFamily: fontSans,
                    fontWeight: 500,
                    fontSize: "0.9rem",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    transition: "all 0.2s ease",
                    cursor: formState === "submitting" ? "not-allowed" : "pointer",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    if (formState !== "submitting") {
                      e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                  }}
                >
                  {formState === "submitting" ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {copy.submitting}
                    </>
                  ) : (
                    <>
                      {copy.submit}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <p
                  style={{
                    fontFamily: fontSans,
                    fontWeight: 300,
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.2)",
                    textAlign: "center",
                  }}
                >
                  {copy.noSpam}
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
