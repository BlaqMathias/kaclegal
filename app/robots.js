const SITE_URL = "https://www.kaclegalpractice.com";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/download", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
