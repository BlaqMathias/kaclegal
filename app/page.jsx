import Hero from "@/components/sections/Hero";
import PracticeAreaGrid from "@/components/sections/PracticeAreaGrid";
import RiskComparison from "@/components/sections/RiskComparison";
import TeamCarousel from "@/components/sections/TeamCarousel";
import TrustBar from "@/components/sections/TrustBar";

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
