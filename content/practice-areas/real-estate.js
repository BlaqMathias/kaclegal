/**
 * Real Estate — practice-area content.
 * Canonical data source for the homepage grid, the practice-areas hub, and the
 * dynamic detail page. Copy is used verbatim from the firm profile.
 *
 * @type {import('./index').PracticeArea}
 */
const realEstate = {
  slug: 'real-estate',
  title: 'Real Estate',
  summary:
    'Advisory on property transactions, title documentation, leases and development projects.',
  intro:
    'Our Real Estate Law practice area provides comprehensive legal services for clients involved in real estate transactions, development, and property management. We are committed to helping our clients achieve their real estate goals with confidence.',
  subServices: [
    {
      title: 'Real Estate Transactions',
      description:
        'We assist clients with the purchase, sale, and lease of residential and commercial properties, including Airbnb, providing guidance throughout the negotiation, and closing processes to protect their interests.',
    },
    {
      title: 'Commercial Leasing',
      description:
        'Our team represents landlords and tenants in commercial lease agreements, Airbnb, advising on terms, conditions, and compliance with local laws to ensure a fair and enforceable contract.',
    },
    {
      title: 'Property Development',
      description:
        'We provide legal support for all stages of property development, including zoning and land use, permitting, construction and environmental compliance, helping clients handle regulatory requirements.',
    },
    {
      title: 'Financing and Mortgage Transactions',
      description:
        'We assist clients in securing financing for real estate transactions, reviewing loan documents, and negotiating favorable terms with lenders.',
    },
    {
      title: 'Due Diligence',
      description:
        'We conduct title searches and reviews, addressing any issues that may arise and facilitating clear title transfers to ensure a smooth transaction.',
    },
    {
      title: 'Real Estate Investment',
      description:
        'We advise investors on structuring real estate investments, including joint ventures and partnerships, to maximize returns while minimizing risk.',
    },
    {
      title: 'Property Management',
      description:
        'Our team provides guidance on property management agreements and compliance with landlord-tenant laws, helping clients effectively manage their real estate assets.',
    },
  ],
  lawyers: ['Koko Asuquo'],
};

export default realEstate;
