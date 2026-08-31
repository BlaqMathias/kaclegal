/**
 * Koko Asuquo — team member profile content.
 * Canonical data source for the team hub and the dynamic profile page. Copy is
 * used verbatim from the firm profile. No formal title is used — name and
 * specialties only.
 *
 * @type {import('./index').TeamMember}
 */
const kokoAsuquo = {
  slug: 'koko-asuquo',
  name: 'Koko Asuquo',
  specialties: ['Company Secretarial', 'Real Estate', 'Data Privacy'],
  photo: '/images/team/koko-asuquo.webp',
  bio: "Koko Asuquo is a legal practitioner with well over five years of experience in dispute resolution, debt recovery, property transactions, and regulatory compliance. He holds an LL.B from Kwame Nkrumah University of Science and Technology and a B.L from the Nigerian Law School, and is a member of the Nigeria Bar Association. He has successfully recovered significant sums for multinational corporations, government agencies, and financial institutions, and leads KAC's work in Company Secretarial, Real Estate, and Data Privacy matters.",
  // Cross-links to real Phase 3 practice-area pages only.
  practiceAreaSlugs: ['company-secretarial', 'real-estate', 'data-privacy'],
};

export default kokoAsuquo;
