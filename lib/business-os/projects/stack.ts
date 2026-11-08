/**
 * Where each product lives: sites, admin panels, backend, hosting, servers and stores.
 * Static on purpose — edit this file to change a link. Never add VPN node IPs or
 * hostnames here; doppler-infra treats the fleet topology as sensitive.
 */

export type StackLink = {
  label: string;
  /** Omitted for things with no web console, such as a server reached over ssh. */
  href?: string;
  note?: string;
  /** Path under /public. Omit it to derive the icon from `href` with `brandIcon`. */
  icon?: string;
};

export type BrandIcon = {
  src: string;
  /** A near-black mark that must be inverted on the dark theme. */
  dark: boolean;
};

const BRANDS = "/logos/brands";
const DARK_MARKS = new Set(["/logos/doppler.svg", `${BRANDS}/vercel.svg`, `${BRANDS}/revolut.svg`, `${BRANDS}/googleplay.svg`]);

/** Hostname suffix → icon. The first match wins, so the more specific hosts come first. */
const BRAND_HOSTS: [string, string][] = [
  ["n8n.dopplervpn.org", `${BRANDS}/n8n.svg`],
  ["admin.dopplervpn.org", "/logos/doppler.svg"],
  ["dopplervpn.org", "/logos/doppler.svg"],
  ["simnetiq.xyz", "/logos/smscode.svg"],
  ["supabase.com", `${BRANDS}/supabase.svg`],
  ["vercel.com", `${BRANDS}/vercel.svg`],
  ["appstoreconnect.apple.com", `${BRANDS}/appstore.svg`],
  ["play.google.com", `${BRANDS}/googleplay.svg`],
  ["partner.microsoft.com", `${BRANDS}/microsoft.svg`],
  ["revenuecat.com", `${BRANDS}/revenuecat.svg`],
  ["revolut.com", `${BRANDS}/revolut.svg`],
  ["oxapay.com", `${BRANDS}/oxapay.svg`],
  ["onlinesim.io", `${BRANDS}/onlinesim.svg`],
  ["t.me", `${BRANDS}/telegram.svg`],
];

/** The link's icon: its explicit `icon`, otherwise the brand that matches its hostname. */
export function brandIcon(link: StackLink): BrandIcon | null {
  let src = link.icon ?? null;
  if (!src && link.href) {
    const host = new URL(link.href).hostname;
    src = BRAND_HOSTS.find(([suffix]) => host === suffix || host.endsWith(`.${suffix}`))?.[1] ?? null;
  }
  return src ? { src, dark: DARK_MARKS.has(src) } : null;
}

export type StackGroup = {
  title: "Websites" | "Admin" | "Backend" | "Hosting" | "Providers" | "Stores & billing";
  links: StackLink[];
};

export type Server = {
  /** Country or city name only — never an IP or a node hostname that resolves to one. */
  place: string;
  flag: string;
  role?: string;
};

export type ServerProvider = {
  /** Null when the hosting company is not written down anywhere yet. */
  provider: string | null;
  /** Path under /public, fetched from the provider's own site. */
  logo?: string;
  href?: string;
  note?: string;
  servers: Server[];
};

export type ProjectStack = {
  /** Matches business_os.projects.slug. */
  slug: string;
  name: string;
  tagline: string;
  groups: StackGroup[];
  servers?: ServerProvider[];
};

const supabase = (ref: string) => `https://supabase.com/dashboard/project/${ref}`;

export const PROJECT_STACKS: ProjectStack[] = [
  {
    slug: "doppler",
    name: "Doppler VPN",
    tagline: "Consumer VPN on iOS, macOS, Android, Windows and the web.",
    groups: [
      {
        title: "Websites",
        links: [
          { label: "dopplervpn.org", href: "https://www.dopplervpn.org" },
          { label: "Telegram mini app", href: "https://doppler-telegram-miniapp.vercel.app", icon: `${BRANDS}/telegram.svg` },
        ],
      },
      {
        title: "Admin",
        links: [
          { label: "Doppler admin", href: "https://admin.dopplervpn.org", note: "pm2 on the Poland VPS" },
          { label: "n8n", href: "https://n8n.dopplervpn.org", note: "Ticket alerts, service monitor, blog" },
        ],
      },
      {
        title: "Backend",
        links: [
          { label: "Supabase", href: supabase("fzlrhmjdjjzcgstaeblu"), note: "fzlrhmjdjjzcgstaeblu" },
          { label: "Table editor", href: `${supabase("fzlrhmjdjjzcgstaeblu")}/editor` },
          { label: "SQL editor", href: `${supabase("fzlrhmjdjjzcgstaeblu")}/sql/new` },
        ],
      },
      {
        title: "Hosting",
        links: [
          { label: "Vercel · dopplervpn", href: "https://vercel.com/romans-projects-a19aa0c4/dopplervpn" },
          { label: "Vercel · doppler-telegram-miniapp", href: "https://vercel.com/romans-projects-a19aa0c4/doppler-telegram-miniapp" },
        ],
      },
      {
        title: "Stores & billing",
        links: [
          { label: "App Store Connect", href: "https://appstoreconnect.apple.com/apps" },
          { label: "Google Play Console", href: "https://play.google.com/console" },
          { label: "Microsoft Partner Center", href: "https://partner.microsoft.com/dashboard" },
          { label: "RevenueCat", href: "https://app.revenuecat.com" },
          { label: "Revolut Business", href: "https://business.revolut.com", note: "Merchant checkout" },
          { label: "OxaPay", href: "https://oxapay.com" },
        ],
      },
    ],
    servers: [
      {
        provider: "Microsoft Azure",
        logo: "/logos/providers/azure.svg",
        href: "https://portal.azure.com",
        note: "VPN nodes, bare xray-core",
        servers: [
          { place: "Sweden", flag: "🇸🇪" },
          { place: "Japan", flag: "🇯🇵" },
          { place: "Canada", flag: "🇨🇦" },
          { place: "United Arab Emirates", flag: "🇦🇪" },
          { place: "Poland 2", flag: "🇵🇱" },
          { place: "United States", flag: "🇺🇸" },
          { place: "Hong Kong", flag: "🇭🇰" },
        ],
      },
      {
        provider: "Fotbo",
        logo: "/logos/providers/fotbo.png",
        href: "https://my.fotbo.com/openstack/instances",
        note: "One hosting account: the Poland bare-metal box and the Netherlands VPS",
        servers: [
          { place: "Poland", flag: "🇵🇱", role: "n8n, admin, bots, Marzban" },
          { place: "Netherlands", flag: "🇳🇱", role: "VPN node, Supabase relay" },
        ],
      },
      {
        provider: "DigitalCloud",
        logo: "/logos/providers/digitalcloud.png",
        href: "https://my.digitalcloud.pro/",
        servers: [
          { place: "Los Angeles", flag: "🇺🇸", role: "VPN node, Poland dead-man check" },
          { place: "St Petersburg", flag: "🇷🇺", role: "VPN node, SNI canary" },
        ],
      },
    ],
  },
  {
    slug: "smscode",
    name: "SMS Code",
    tagline: "iOS app for one-time codes on virtual numbers, paid in coins.",
    groups: [
      {
        title: "Websites",
        links: [{ label: "simnetiq.xyz", href: "https://simnetiq.xyz" }],
      },
      {
        title: "Admin",
        links: [{ label: "SMS admin", href: "https://simnetiq.xyz/admin", note: "Users, purchases, delivery, support" }],
      },
      {
        title: "Backend",
        links: [
          { label: "Supabase", href: supabase("zkuwqvtwlomktysuymyw"), note: "zkuwqvtwlomktysuymyw" },
          { label: "Edge Functions", href: `${supabase("zkuwqvtwlomktysuymyw")}/functions` },
          { label: "SQL editor", href: `${supabase("zkuwqvtwlomktysuymyw")}/sql/new` },
        ],
      },
      {
        title: "Hosting",
        links: [
          {
            label: "Vercel · simnetiq-landing",
            href: "https://vercel.com/dashboard",
            note: "In a separate Vercel team; pick it in the team switcher",
          },
        ],
      },
      {
        title: "Providers",
        links: [
          { label: "OnlineSim", href: "https://onlinesim.io", note: "Number supplier, USD balance" },
          { label: "n8n", href: "https://n8n.dopplervpn.org", note: "Support emails" },
        ],
      },
      {
        title: "Stores & billing",
        links: [
          { label: "App Store Connect", href: "https://appstoreconnect.apple.com/apps/6803515179", note: "com.simnetiq.smscode" },
          { label: "RevenueCat", href: "https://app.revenuecat.com" },
        ],
      },
    ],
  },
];
