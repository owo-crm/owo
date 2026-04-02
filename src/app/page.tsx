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

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <PainSection />
        <SolutionSection />
        <HowItWorks />
        <AccessSection />
        <UseCases />
        <SurveySection />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
