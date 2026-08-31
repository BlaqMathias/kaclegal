/**
 * Company Secretarial & Legal Advisory Services — practice-area content.
 * Canonical data source for the homepage grid, the practice-areas hub, and the
 * dynamic detail page. Copy is used verbatim from the firm profile.
 *
 * @type {import('./index').PracticeArea}
 */
const companySecretarial = {
  slug: 'company-secretarial',
  title: 'Company Secretarial & Legal Advisory Services',
  summary:
    'Company formation, corporate governance and day-to-day statutory compliance for growing businesses.',
  intro:
    "Our Company Secretarial and Legal Advisory Services practice area is designed to provide comprehensive, strategic guidance to businesses across various sectors. With a focus on proactive solutions, we empower businesses to seize opportunities, and achieve sustainable growth in a complex legal environment. With our expertise, clients can focus on what they do best—growing their business—while we handle the legal landscape, enabling them to make informed decisions that align with their business goals.",
  subServices: [
    {
      title: 'Business Formation and Structure',
      description:
        'We assist clients in choosing the right business entity and structure, ensuring compliance with local and international regulations while aligning with their strategic objectives.',
    },
    {
      title: 'Contract Negotiation, Drafting and Review',
      description:
        "Our team provides expert advice on contract negotiations, helping clients draft clear, enforceable agreements that protect their interests and minimize risk. We also review already drafted contracts, ensuring our client's interest are adequately protected.",
    },
    {
      title: 'Meeting Administration',
      description:
        'We manage the logistics of board meetings and shareholder meetings, including the preparation of agendas, minutes, and resolutions, ensuring all proceedings are documented and compliant.',
    },
    {
      title: 'Regulatory Filings',
      description:
        'Our experts handle the preparation and submission of regulatory filings, such as annual returns and changes in corporate structure, ensuring that all deadlines are met.',
    },
    {
      title: 'Shareholder Services',
      description:
        'We manage shareholder records, including share transfers, dividends, and other shareholder communications, ensuring accurate and timely information dissemination.',
    },
    {
      title: 'Corporate Governance',
      description:
        'We advise on best practices for corporate governance, helping businesses establish effective policies and procedures that promote transparency, accountability, and compliance with legal requirements.',
    },
  ],
  lawyers: ['Koko Asuquo', 'Esioh Nwokolo'],
};

export default companySecretarial;
