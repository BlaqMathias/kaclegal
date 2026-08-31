/**
 * Data Privacy and Protection — practice-area content.
 * Canonical data source for the homepage grid, the practice-areas hub, and the
 * dynamic detail page. Copy is used verbatim from the firm profile.
 *
 * @type {import('./index').PracticeArea}
 */
const dataPrivacy = {
  slug: 'data-privacy',
  title: 'Data Privacy and Protection',
  summary:
    'NDPA-aligned data protection, privacy audits and safeguards for the personal data you hold.',
  intro:
    'In an increasingly digital world, safeguarding personal and business data is more critical than ever. Our Data Privacy and Protection practice area is dedicated to helping clients comply with Data Protection laws and Regulations.',
  subServices: [
    {
      title: 'Regulatory Compliance',
      description:
        'We assist businesses in understanding and complying with the Nigeria Data Protection Act, 2023; Nigeria Data Protection Regulation 2019 and other local laws, helping them implement effective compliance strategies.',
    },
    {
      title: 'Risk Assessment and Management',
      description:
        'Our team conducts thorough assessments to identify vulnerabilities in data handling practices and provides tailored recommendations to mitigate risks.',
    },
    {
      title: 'Data Breach Response',
      description:
        'In the event of a data breach, we offer immediate legal guidance to manage the situation effectively, including notification obligations, regulatory responses, and damage control strategies.',
    },
    {
      title: 'Privacy Policies and Agreements',
      description:
        'We draft and review privacy policies, terms of service, and data processing agreements to ensure they meet legal requirements and reflect best practices.',
    },
    {
      title: 'Litigation Support',
      description:
        "In cases of data privacy disputes or litigation, our experienced team of legal practitioners provide robust representation to protect our clients' interests.",
    },
  ],
  lawyers: ['Koko Asuquo'],
};

export default dataPrivacy;
