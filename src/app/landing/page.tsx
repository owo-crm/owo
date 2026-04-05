import { AccessSection } from "@/components/landing/AccessSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Navbar } from "@/components/landing/Navbar";
import { PainSection } from "@/components/landing/PainSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { SurveySection } from "@/components/landing/SurveySection";
import { UseCases } from "@/components/landing/UseCases";
import { getLandingConfig, resolveLandingLocale } from "@/config/landing";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const locale = resolveLandingLocale(params.lang);
  const config = getLandingConfig(locale);

  return (
    <>
      <Navbar config={config} />
      <main>
        <Hero config={config} />
        <PainSection config={config} />
        <SolutionSection config={config} />
        <HowItWorks config={config} />
        <SurveySection sectionId={config.survey.sectionId} initialLocale={locale} />
        <AccessSection config={config} />
        <UseCases config={config} />
        <FinalCTA config={config} />
      </main>
      <Footer config={config} />
    </>
  );
}
