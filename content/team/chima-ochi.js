/**
 * Chima Ochi — team member profile content.
 * Canonical data source for the team hub and the dynamic profile page. Copy is
 * used verbatim from the firm profile. No formal title is used — name and
 * specialties only.
 *
 * @type {import('./index').TeamMember}
 */
const chimaOchi = {
  slug: 'chima-ochi',
  name: 'Chima Ochi',
  specialties: ['Intellectual Property', 'Contracts', 'Labour Disputes'],
  photo: '/images/team/chima-ochi.webp',
  bio: "Chima Ochi is a qualified Barrister with an LL.M in Law from Nnamdi Azikiwe University and extensive experience in legal advisory, regulatory compliance, and contract management from senior in-house roles across Nigeria's energy and fintech sectors. At KAC, he focuses on Intellectual Property, Contracts, and Labour Disputes.",
  // "Contracts" and "Labour Disputes" have no standalone Phase 3 page, so they
  // are not linked — only intellectual-property resolves to a real page.
  practiceAreaSlugs: ['intellectual-property'],
};

export default chimaOchi;
