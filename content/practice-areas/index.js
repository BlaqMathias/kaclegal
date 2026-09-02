import commercialLaw from "./commercial-law";
import companySecretarial from "./company-secretarial";
import dataPrivacy from "./data-privacy";
import employmentLabourLaw from "./employment-labour-law";
import familyLaw from "./family-law";
import intellectualProperty from "./intellectual-property";
import realEstate from "./real-estate";
import regulatoryCompliance from "./regulatory-compliance";

/**
 * @typedef {object} SubService
 * @property {string} title - Name of the sub-service.
 * @property {string} description - One-paragraph description of the sub-service.
 *
 * @typedef {object} PracticeArea
 * @property {string} slug - URL segment, e.g. 'data-privacy' -> /practice-areas/data-privacy.
 * @property {string} title - Display name of the practice area.
 * @property {string} summary - One-sentence teaser (shared with the homepage grid).
 * @property {string} intro - Opening paragraph shown on the detail page.
 * @property {SubService[]} subServices - The services offered under this area.
 * @property {string[]} lawyers - Names of assigned practitioners (empty if none yet).
 */

/**
 * All practice areas in display order: commercial areas first, Family Law last.
 * This single array is the source of truth for the homepage teaser grid, the
 * /practice-areas hub, and the /practice-areas/[slug] detail pages.
 *
 * @type {PracticeArea[]}
 */
export const practiceAreas = [
  companySecretarial,
  dataPrivacy,
  regulatoryCompliance,
  intellectualProperty,
  realEstate,
  commercialLaw,
  employmentLabourLaw,
  familyLaw,
];

/**
 * Look up a single practice area by its slug.
 *
 * @param {string} slug - The URL segment to match.
 * @returns {PracticeArea | undefined} The matching area, or undefined if none.
 */
export function getPracticeArea(slug) {
  return practiceAreas.find((area) => area.slug === slug);
}

/**
 * All valid practice-area slugs — used by the detail route's
 * generateStaticParams to pre-render each page at build time.
 *
 * @returns {string[]} The list of slugs.
 */
export function getPracticeAreaSlugs() {
  return practiceAreas.map((area) => area.slug);
}
