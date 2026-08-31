import Card from '@/components/ui/Card';

/**
 * Build a Google Maps "search" URL for an address. Uses the public Maps URL
 * scheme (no API key / billing required); opens the Maps app or website with
 * the address pre-searched.
 *
 * @param {string} address
 * @returns {string}
 */
function directionsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/** Small inline icon wrapper for consistent sizing/colour. */
function Icon({ children }) {
  return (
    <svg
      className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-teal"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/**
 * OfficeCard — a reusable office information block: name, address, email, phone,
 * and a "Get Directions" link. Email and phone are actionable (`mailto:`/`tel:`)
 * and directions open Google Maps in a new tab. These are intentionally native
 * anchors (external / non-navigation schemes), not next/link.
 *
 * @param {object} props
 * @param {object} props.office - Office details.
 * @param {string} props.office.name - Office name / city label (e.g. "Lagos Office").
 * @param {string} props.office.address - Full street address.
 * @param {string} props.office.email - Contact email address.
 * @param {string} props.office.phone - Contact phone number (display format).
 */
export default function OfficeCard({ office }) {
  const { name, address, email, phone } = office;
  // tel: links must be digits/plus only — strip spaces and punctuation.
  const telHref = `tel:${phone.replace(/[^\d+]/g, '')}`;

  return (
    <Card>
      <h3 className="font-display text-h4 text-brand-navy">{name}</h3>

      <ul className="mt-4 space-y-3 text-body text-brand-slate">
        <li className="flex gap-3">
          <Icon>
            <path d="M12 21s-7-6.3-7-11a7 7 0 0114 0c0 4.7-7 11-7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </Icon>
          <span>{address}</span>
        </li>

        <li className="flex gap-3">
          <Icon>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </Icon>
          <a
            href={`mailto:${email}`}
            className="text-brand-navy underline decoration-brand-teal/40 underline-offset-4 transition-colors hover:text-brand-teal"
          >
            {email}
          </a>
        </li>

        <li className="flex gap-3">
          <Icon>
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
          </Icon>
          <a
            href={telHref}
            className="text-brand-navy underline decoration-brand-teal/40 underline-offset-4 transition-colors hover:text-brand-teal"
          >
            {phone}
          </a>
        </li>
      </ul>

      <a
        href={directionsUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-1.5 text-caption font-semibold uppercase tracking-[0.12em] text-brand-teal transition-colors hover:text-brand-navy"
      >
        Get Directions
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 17 17 7" />
          <path d="M7 7h10v10" />
        </svg>
      </a>
    </Card>
  );
}
