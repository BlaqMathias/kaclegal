/**
 * Family Law — practice-area content.
 * Canonical data source for the homepage grid, the practice-areas hub, and the
 * dynamic detail page. Copy is used verbatim from the firm profile.
 *
 * NOTE: `lawyers` is intentionally EMPTY. None of the three named practitioners
 * list Family Law among their specialties, so no lawyer is assigned yet — the
 * detail template renders no "handled by" callout when this array is empty.
 * Awaiting the firm's decision on who should be attributed here (Phase 4).
 *
 * @type {import('./index').PracticeArea}
 */
const familyLaw = {
  slug: 'family-law',
  title: 'Family Law',
  summary:
    'Considered, practical counsel on family and matrimonial matters when it is needed most.',
  intro:
    "Our Family Law practice area provides compassionate, experienced legal support during some of life's most challenging moments. We understand that family law issues can be emotionally charged and complex, and we are committed to helping our clients overcome these situations with sensitivity and expertise.",
  subServices: [
    {
      title: 'Divorce and Separation',
      description:
        'We guide clients through the divorce process, offering advice on asset division, alimony, and legal separation, ensuring that their rights and interests are protected.',
    },
    {
      title: 'Child Custody and Support',
      description:
        'Our team advocates for the best interests of children in custody disputes, helping to establish fair custody arrangements and child support agreements that reflect the needs of the family. We also advise on surrogacy.',
    },
    {
      title: 'Adoption',
      description:
        'We provide comprehensive legal support for all types of adoptions, including domestic, international, and stepparent adoptions, ensuring a smooth process for families expanding their households.',
    },
    {
      title: 'Marital Agreements',
      description:
        'We assist clients in drafting and negotiating prenuptial and postnuptial agreements, helping to protect assets and clarify expectations before or during marriage.',
    },
    {
      title: 'Domestic Violence and Restraining Orders',
      description:
        'We support victims of domestic violence by obtaining protective orders and providing legal representation to ensure their safety and well-being.',
    },
    {
      title: 'Paternity Issues',
      description:
        "We help establish paternity through legal proceedings, ensuring that fathers' rights are recognized, and that child support and custody matters are appropriately addressed.",
    },
    {
      title: 'Mediation and Alternative Dispute Resolution',
      description:
        'We promote amicable resolutions through mediation and other dispute resolution methods, helping clients reach mutually beneficial agreements while minimizing conflict.',
    },
    {
      title: 'Modification and Enforcement',
      description:
        'We assist clients with modifying existing court orders related to custody, support, and visitation, as well as enforcing these orders when necessary.',
    },
  ],
  lawyers: ['Donald S. Essien, Esq.'],
};

export default familyLaw;
