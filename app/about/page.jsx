import Reveal from "@/components/motion/Reveal";
import { RevealItem, RevealStagger } from "@/components/motion/RevealStagger";
import Button from "@/components/ui/Button";
import HoverImage from "@/components/ui/HoverImage";
import Section from "@/components/ui/Section";
import Image from "next/image";

export const metadata = {
  title: "About the Firm",
  description:
    "Koko Asuquo Chambers (K.A.C) is a modern commercial law firm pairing legal expertise with technology to serve businesses and individuals in Nigeria and beyond.",
};

const vision =
  "To be the leading modern commercial law firm, redefining the legal experience through innovative and technological solutions, simplified problem solving, unwavering integrity, and a commitment to fostering sustainable business practices, empowering our clients to thrive in a rapidly evolving global landscape.";

const mission =
  "Our mission is to provide exceptional legal services that combine expert knowledge with cutting-edge technology, ensuring our clients navigate complex commercial landscapes with confidence. We strive to build long-lasting partnerships by delivering tailored strategies, promoting transparency, and championing ethical practices that drive positive impact in our communities and beyond.";

const values =
  "We are client centric and committed to leveraging technology and innovation in providing excellent services to support the needs of our client. We uphold the highest form of integrity, honesty and ethical business practices while caring for the needs of our community.";

/**
 * Value pillars — a scannable distillation of the `values` statement above
 * (client-centric · innovation · integrity · community). Kept factual and
 * non-comparative in line with Nigerian RPC Rule 39.
 * @type {{title: string, description: string}[]}
 */
const firmValues = [
  {
    title: "Client-Centric",
    description: "Services shaped around each client’s needs.",
  },
  {
    title: "Innovation",
    description: "Technology and innovation applied to real legal problems.",
  },
  {
    title: "Integrity",
    description: "Honesty and ethical practice, without exception.",
  },
  {
    title: "Community",
    description: "Care for the needs of the communities we serve.",
  },
];

/** @type {string[]} */
const aboutParagraphs = [
  "Koko Asuquo Chambers or K. A. C as we are fondly known is a leading modern commercial law firm dedicated to transforming the legal landscape for businesses and individuals in today’s dynamic environment. Our team of experienced legal practitioners combine deep industry knowledge with innovative approaches, ensuring that our clients receive comprehensive legal solutions tailored to their unique needs.",
  "Founded on the principles of excellence, proactiveness, innovation, technological advancement, integrity, and collaboration, we pride ourselves in providing top notch legal services to our clients. We understand that in today’s fast-paced world, businesses require not just legal expertise but also strategic insight. Our multidisciplinary team is equipped to cover a wide range of individual and commercial services such as Data Privacy, Company Secretarial and Legal Advisory Services, Regulatory Compliance, Intellectual Property and Employment related disputes.",
  "Leveraging the latest technology, we streamline processes and enhance communication, making legal services more accessible, simplified, and efficient. Our strength lies in the diversity of our clientele, with clients ranging from start-up, local businesses, multinationals, governments, and high net-worth individuals.",
];

const pullQuote =
  "At K.A.C, we believe that our success is measured by the success of our clients. We are passionate about empowering businesses to thrive and achieve their goals in an ever-evolving marketplace. Together, we can turn challenges into opportunities and pave the way for a brighter future.";

export default function AboutPage() {
  return (
    <>
      <Section
        background="white"
        spacing="sm"
        container={false}
        className="relative overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(4,80,159,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(4,80,159,0.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 65% 55% at 50% 30%, black 0%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 65% 55% at 50% 30%, black 0%, transparent 75%)",
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 hidden justify-center sm:flex">
          <div className="mt-4 h-[320px] w-[320px] rounded-full bg-brand-teal/20 blur-[100px] md:h-[420px] md:w-[420px]" />
          <div className="absolute -right-10 top-24 h-[220px] w-[220px] rounded-full bg-brand-navy/15 blur-[90px]" />
        </div>

        <div className="container-kac relative z-10">
          <Reveal variant="fadeUp" className="mx-auto max-w-3xl text-center">
            <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
              About the Firm
            </p>
            <h1 className="mt-3 font-display font-bold text-hero text-brand-navy">
              What Do <span className="text-brand-navyDark"> We Do</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-body text-brand-muted">
              We pair commercial legal expertise with technology to help
              businesses and individuals move forward with clarity.
            </p>
          </Reveal>
        </div>
      </Section>

      <Section background="navyDarkPanel" spacing="lg">
        <div className="space-y-16 md:space-y-24">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <Reveal variant="slideRight">
              <HoverImage
                src="/images/sections/vision.jpg"
                tilt="left"
                alt="Representative image for the firm's vision"
              />
            </Reveal>
            <Reveal variant="slideLeft" delay={0.1}>
              <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
                Looking Ahead
              </p>
              <h2 className="mt-3 font-display text-h2 text-white">
                Our Vision
              </h2>
              <p className="mt-4 text-body text-white/75">{vision}</p>
            </Reveal>
          </div>

          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <Reveal variant="slideRight" className="order-2 md:order-1">
              <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
                What Drives Us
              </p>
              <h2 className="mt-3 font-display text-h2 text-white">
                Our Mission
              </h2>
              <p className="mt-4 text-body text-white/75">{mission}</p>
            </Reveal>
            <Reveal
              variant="slideLeft"
              delay={0.1}
              className="order-1 md:order-2"
            >
              <HoverImage
                src="/images/sections/mission.jpg"
                tilt="right"
                alt="Representative image for the firm's mission"
              />
            </Reveal>
          </div>
        </div>
      </Section>

      <Section
        background="navyDarkPanel"
        spacing="md"
        container={false}
        className="relative overflow-hidden"
      >
        {/* Background image + navy scrim for text contrast */}
        <div aria-hidden="true" className="absolute inset-0 z-0">
          <Image
            src="/images/sections/aboutgreek.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-brand-navyDark/85" />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
        >
          <div className="absolute -left-24 top-0 h-[380px] w-[380px] animate-blob-a rounded-full bg-brand-teal/25 blur-[120px]" />
          <div className="absolute right-[-10%] top-1/3 h-[320px] w-[320px] animate-blob-b rounded-full bg-brand-navy/40 blur-[110px]" />
          <div
            className="absolute bottom-[-15%] left-1/3 h-[300px] w-[300px] animate-blob-a rounded-full bg-brand-teal/15 blur-[110px]"
            style={{ animationDelay: "4s" }}
          />
        </div>

        <div className="container-kac relative z-10">
          <Reveal variant="fadeUp" className="mx-auto max-w-2xl text-center">
            <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
              What We Stand For
            </p>
            <h2 className="mt-3 font-display text-h2 text-white">Our Values</h2>
            <p className="mt-5 text-body text-white/80">{values}</p>
          </Reveal>

          <RevealStagger className="mx-auto mt-14 grid max-w-5xl gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {firmValues.map((item) => (
              <RevealItem
                key={item.title}
                variant="fadeUp"
                className="border-l-2 border-brand-teal pl-5"
              >
                <h3 className="font-display text-h4 text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-body text-white/70">
                  {item.description}
                </p>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </Section>

      <Section background="offWhite" spacing="lg">
        <Reveal variant="appear">
          <p className="text-center text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
            About Us
          </p>
        </Reveal>

        <Reveal
          variant="morph"
          duration={0.8}
          className="mx-auto mt-6 max-w-5xl overflow-hidden rounded-3xl bg-brand-navyDark shadow-card-hover"
        >
          <div className="bg-brand-navy px-6 py-5 text-center sm:px-10">
            <h2 className="font-display text-h3 text-white">Who We Are</h2>
          </div>

          <div className="relative px-6 py-12 sm:px-12 sm:py-14 md:px-16">
            <span
              aria-hidden="true"
              className="absolute left-5 top-5 h-7 w-7 border-l-2 border-t-2 border-brand-teal sm:left-7 sm:top-7"
            />
            <span
              aria-hidden="true"
              className="absolute bottom-5 right-5 h-7 w-7 border-b-2 border-r-2 border-brand-teal sm:bottom-7 sm:right-7"
            />

            <div className="mx-auto max-w-3xl space-y-5 text-center">
              {aboutParagraphs.map((paragraph, index) => (
                <p key={index} className="text-body text-white/80">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-9 flex justify-center">
              <Button
                href="/contact"
                className="!rounded-full !bg-white !text-brand-navy hover:!bg-brand-offWhite focus-visible:!ring-white focus-visible:!ring-offset-brand-navyDark"
              >
                Request a Consultation
              </Button>
            </div>
          </div>
        </Reveal>
      </Section>

      <Section background="navy" spacing="lg">
        <Reveal variant="zoom">
          <blockquote className="mx-auto max-w-4xl text-center">
            <p className="font-display text-h2 leading-snug text-white">
              &ldquo;{pullQuote}&rdquo;
            </p>
          </blockquote>
        </Reveal>
      </Section>
    </>
  );
}
