import type { Locale } from "@/lib/i18n";

type SurveyI18n = {
  title: string;
  subtitle: string;
  stepLabel: string;
  next: string;
  back: string;
  submit: string;
  successTitle: string;
  successBody: string;
  requiredError: string;
  submitError: string;
  consentLabel: string;
  stepTitles: string[];
};

const EN_SURVEY: SurveyI18n = {
  title: "Join the early access list",
  subtitle: "Two minutes — and you're on the list. We'll reach out before launch.",
  stepLabel: "Step",
  next: "Next",
  back: "Back",
  submit: "Submit",
  successTitle: "Thanks, your request was received",
  successBody:
    "We saved your answers for early access and will contact you after review.",
  requiredError: "Please fill all required fields for this step.",
  submitError: "Could not submit the form. Please try again.",
  consentLabel: "I agree to be contacted about my early access request.",
  stepTitles: [
    "Profile",
    "Pain",
    "Priority",
    "Source",
    "Contact",
  ],
};

const PL_SURVEY: SurveyI18n = {
  title: "Dołącz do listy wcześniejszego dostępu",
  subtitle: "Dwie minuty — i jesteś na liście. Odezwiemy się przed startem.",
  stepLabel: "Krok",
  next: "Dalej",
  back: "Wstecz",
  submit: "Wyślij",
  successTitle: "Dziękujemy — jesteś na liście",
  successBody:
    "Zapisaliśmy Twoje zgłoszenie. Odezwiemy się przed startem z informacją o dostępie.",
  requiredError: "Uzupełnij wszystkie wymagane pola w tym kroku.",
  submitError: "Nie udało się wysłać formularza. Spróbuj ponownie.",
  consentLabel: "Zgadzam się na kontakt w sprawie mojego zgłoszenia early access.",
  stepTitles: [
    "Profil",
    "Ból",
    "Priorytet",
    "Źródło",
    "Kontakt",
  ],
};

export function getSurveyI18n(locale: Locale): SurveyI18n {
  return locale === "pl" ? PL_SURVEY : EN_SURVEY;
}
