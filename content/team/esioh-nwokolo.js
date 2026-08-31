/**
 * Esioh Nwokolo — team member profile content.
 * Canonical data source for the team hub and the dynamic profile page. Copy is
 * used verbatim from the firm profile. No formal title is used — name and
 * specialties only.
 *
 * @type {import('./index').TeamMember}
 */
const esiohNwokolo = {
  slug: 'esioh-nwokolo',
  name: 'Esioh Nwokolo',
  specialties: ['Contracts', 'Legal Advisory', 'Regulatory Compliance'],
  photo: '/images/team/esioh-nwokolo.webp',
  bio: "Esioh Nwokolo is an eloquent lawyer with a flair for corporate commercial practice spanning company secretarial work, employment and labour law, debt recovery, and litigation. She has rendered legal advisory services to a range of business and individual clients, and leads KAC's work in Contracts, Legal Advisory, and Regulatory Compliance.",
  // "Contracts" is a sub-service, not a standalone page; "Legal Advisory" lives
  // within the company-secretarial page. Only real practice-area slugs listed.
  practiceAreaSlugs: ['company-secretarial', 'regulatory-compliance'],
};

export default esiohNwokolo;
