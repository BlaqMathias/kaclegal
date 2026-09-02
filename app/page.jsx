import Hero from "@/components/sections/Hero";
import PracticeAreaGrid from "@/components/sections/PracticeAreaGrid";
import RiskComparison from "@/components/sections/RiskComparison";
import TeamCarousel from "@/components/sections/TeamCarousel";
import TrustBar from "@/components/sections/TrustBar";

export const metadata = {
  description:
    "Modern commercial law for growing businesses in Lagos and Uyo — company secretarial, data privacy, regulatory compliance, and more.",
};

export default function Home() {
  return (
    <>
      <Hero />
      <PracticeAreaGrid background="navyDarkPanel" roundedCards />
      <RiskComparison />
      <TeamCarousel />
      <TrustBar />
    </>
  );
}
