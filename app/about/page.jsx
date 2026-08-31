import Card from "@/components/ui/Card";
import Section from "@/components/ui/Section";

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
      <Section background="offWhite" spacing="lg">
        <div className="max-w-3xl">
          <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
            About the Firm
          </p>
          <h1 className="mt-3 font-display text-hero text-brand-navy">
            Koko Asuquo Chambers
          </h1>
          <p className="mt-5 text-body-lg text-brand-muted">
            A modern commercial law firm pairing deep legal expertise with
            technology — built to help businesses and individuals move forward
            with clarity.
          </p>
        </div>
      </Section>

      <Section background="navyPanel" spacing="md">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="!shadow-2xl">
            <h2 className="font-display text-h3 text-brand-navy">Our Vision</h2>
            <p className="mt-4 text-body text-brand-slate">{vision}</p>
          </Card>
          <Card className="!shadow-2xl">
            <h2 className="font-display text-h3 text-brand-navy">
              Our Mission
            </h2>
            <p className="mt-4 text-body text-brand-slate">{mission}</p>
          </Card>
        </div>
      </Section>

      <Section background="navyDarkPanel" spacing="md">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
            What We Stand For
          </p>
          <h2 className="mt-3 font-display text-h2 text-white">Our Values</h2>
          <p className="mt-5 text-body-lg text-white/80">{values}</p>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {firmValues.map((item) => (
            <div key={item.title} className="border-l-2 border-brand-teal pl-5">
              <h3 className="font-display text-h4 text-white">{item.title}</h3>
              <p className="mt-2 text-body text-white/70">{item.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section background="white" spacing="md">
        <div className="max-w-3xl">
          <p className="text-caption font-semibold uppercase tracking-[0.22em] text-brand-teal">
            About Us
          </p>
          <h2 className="mt-3 font-display text-h2 text-brand-navy">
            Who we are
          </h2>
          <div className="mt-6 space-y-5">
            {aboutParagraphs.map((paragraph, index) => (
              <p key={index} className="text-body text-brand-slate">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </Section>

      <Section background="navy" spacing="lg">
        <blockquote className="mx-auto max-w-4xl text-center">
          <p className="font-display text-h2 leading-snug text-white">
            &ldquo;{pullQuote}&rdquo;
          </p>
        </blockquote>
      </Section>
    </>
  );
}
