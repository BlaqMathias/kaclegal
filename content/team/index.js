import kokoAsuquo from './koko-asuquo';
import donaldEssien from './donald-essien';
import nyebukJohnson from './nyebuk-johnson';
import helenJoseph from './helen-joseph';

/**
 * @typedef {object} TeamMember
 * @property {string} slug - URL segment, e.g. 'koko-asuquo' -> /team/koko-asuquo.
 * @property {string} name - Full name (no formal title).
 * @property {string} role - Role within KAC Legal.
 * @property {string[]} specialties - Display specialties (shown as badges; some may
 *   not have a matching practice-area page).
 * @property {string} photo - Public path to the headshot, e.g. '/images/team/koko-asuquo.webp'.
 * @property {string[]} bio - Biography paragraphs.
 * @property {string[]} practiceAreaSlugs - Slugs of real Phase 3 practice-area pages this
 *   member leads/contributes to (used for clickable cross-links).
 */

/**
 * All team members in display order. Single source of truth for the team hub
 * and the /team/[slug] profile pages.
 *
 * @type {TeamMember[]}
 */
export const team = [kokoAsuquo, donaldEssien, nyebukJohnson, helenJoseph];

/**
 * Look up a team member by slug.
 *
 * @param {string} slug - The URL segment to match.
 * @returns {TeamMember | undefined}
 */
export function getTeamMember(slug) {
  return team.find((member) => member.slug === slug);
}

/**
 * All team slugs — used by the profile route's generateStaticParams.
 *
 * @returns {string[]}
 */
export function getTeamSlugs() {
  return team.map((member) => member.slug);
}

/**
 * Resolve a team member by their exact name. Used by the practice-area detail
 * page to turn "handled by" names into links to the matching profile. Returns
 * undefined for names with no profile (so callers can fall back to plain text).
 *
 * @param {string} name - The full name to match.
 * @returns {TeamMember | undefined}
 */
export function getTeamMemberByName(name) {
  return team.find((member) => member.name === name);
}
