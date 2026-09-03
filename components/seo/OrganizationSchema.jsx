import { practiceAreas } from "@/content/practice-areas";

const SITE_URL = "https://kaclegalpractice.com";

/**
 * OrganizationSchema — JSON-LD structured data describing Koko Asuquo
 * Chambers as a LegalService, with both physical offices represented as
 * separate entries under one shared parent identity (name, phone, logo,
 * services). Rendered once, site-wide, from the root layout — not per page.
 *
 * IMPORTANT — this file has TWO placeholders that MUST be filled in with the
 * real street address, city, and postal code for each office before this
 * goes live. Business hours are deliberately left out entirely rather than
 * guessed — schema.org treats openingHoursSpecification as optional, so
 * omitting it is valid; add it later once the real hours are confirmed.
 */
export default function OrganizationSchema() {
  const services = practiceAreas.map((area) => ({
    "@type": "Service",
    name: area.title,
    description: area.summary,
  }));

  const sharedFields = {
    "@type": "LegalService",
    name: "Koko Asuquo Chambers",
    url: SITE_URL,
    logo: `${SITE_URL}/images/logo/kac-logo.png`,
    telephone: "+2348147312802",
    email: "info@kaclegalpractice.com",
    address: {
      "@type": "PostalAddress",
      addressCountry: "NG",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Practice Areas",
      itemListElement: services,
    },
  };

  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...sharedFields,
        "@id": `${SITE_URL}/#lagos-office`,
        address: {
          ...sharedFields.address,
          streetAddress: "5, Pascal Offiah Close, off Platinum Way, Lekki",
          addressLocality: "Lagos",
          addressRegion: "Lagos State",
        },
      },
      {
        ...sharedFields,
        "@id": `${SITE_URL}/#uyo-office`,
        address: {
          ...sharedFields.address,
          streetAddress: "4, Udoumana Street",
          addressLocality: "Uyo",
          addressRegion: "Akwa Ibom State",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
