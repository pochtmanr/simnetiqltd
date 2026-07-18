/**
 * Canonical origin for the site. Every absolute URL we emit — canonicals,
 * hreflang, sitemap locs, robots.txt Host, JSON-LD @id, llms.txt links, email
 * links — must be built from this one value, so a host change is a one-line
 * change rather than a hunt across twenty files.
 *
 * No trailing slash. Callers append their own leading-slash paths.
 */
export const SITE_URL = "https://simnetiq.store";
