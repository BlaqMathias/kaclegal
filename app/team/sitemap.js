import { getPracticeAreaSlugs } from "@/content/practice-areas";
import { getTeamSlugs } from "@/content/team";
import { createSupabasePublicClient } from "@/lib/supabaseServer";

/**
 * The live, canonical domain. Update this in exactly one place if the domain
 * ever changes — everything else in this file (and metadataBase in
 * app/layout.jsx) should point here rather than hardcoding the string again.
 */
const SITE_URL = "https://kaclegalpractice.com";

/**
 * app/sitemap.js — a Next.js special file. Returning an array here makes
 * Next.js automatically serve it at /sitemap.xml; nothing else needs to
 * reference this file directly.
 *
 * Deliberately excludes: /admin/* (private, and blocked in robots.js too),
 * /download/[token] (single-use purchase links — indexing one would be
 * actively wrong, not just unhelpful), and any Supabase query failure falls
 * back to just the static + content-driven pages rather than crashing the
 * whole sitemap over one bad request.
 */
export default async function sitemap() {
  const staticPages = [
    { url: SITE_URL, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${SITE_URL}/team`, changeFrequency: "monthly", priority: 0.7 },
    {
      url: `${SITE_URL}/publications`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.6 },
    {
      url: `${SITE_URL}/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const practiceAreaPages = getPracticeAreaSlugs().map((slug) => ({
    url: `${SITE_URL}/practice-areas/${slug}`,
    changeFrequency: "yearly",
    priority: 0.8,
  }));

  const teamPages = getTeamSlugs().map((slug) => ({
    url: `${SITE_URL}/team/${slug}`,
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  let publicationPages = [];
  try {
    const supabase = createSupabasePublicClient();
    const { data, error } = await supabase
      .from("publications")
      .select("slug, updated_at")
      .eq("status", "published");

    if (error) {
      console.error("[sitemap] Could not load publications:", error);
    } else {
      publicationPages = (data ?? []).map((publication) => ({
        url: `${SITE_URL}/publications/${publication.slug}`,
        lastModified: publication.updated_at
          ? new Date(publication.updated_at)
          : undefined,
        changeFrequency: "monthly",
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error("[sitemap] Could not load publications:", error);
  }

  return [
    ...staticPages,
    ...practiceAreaPages,
    ...teamPages,
    ...publicationPages,
  ];
}
