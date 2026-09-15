import Hero from "@/components/sections/Hero";
import RiskComparison from "@/components/sections/RiskComparison";
import TeamCarousel from "@/components/sections/TeamCarousel";
import TrustBar from "@/components/sections/TrustBar";

export const metadata = {
  description:
    "Koko Asuquo Chambers combines sound legal expertise, commercial insight and technology to help businesses and individuals across Nigeria move forward with clarity.",
};

export default function Home() {
  return (
    <>
      <Hero />
      <RiskComparison />
      <TeamCarousel />
      <TrustBar />
    </>
  );
}
