import type {
  FooterConfig,
  LinkConfig,
  ProfileConfig,
  PublicationConfig,
  SiteConfig,
} from "@/types"

export const SITE: SiteConfig = {
  title: "Christopher Weber",
  // SiteConfigSchema caps this at 100 characters (used as the meta description).
  description:
    "Professor of Political Science, University of Arizona. Political psychology, behavior, voter files.",
  href: "https://christopher-weber.com",
  author: "Christopher Weber",
  dir: "ltr",
  defaultPageImage: "/img/social-preview.png",
  defaultPostImage: "/img/social-preview.png",

  locale: {
    lang: "en-US",
    options: {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "America/Phoenix",
    },
  },

  blog: {
    featuredPostCount: 3,
    postsPerPage: 8,
    tocMaxDepth: 3,
    shareActions: ["x"],
  },

  home: {
    careerHighlightCount: 4,
    updateCount: 3,
    publicationCount: 3,
  },

  favicon: "/favicon.ico",
  prerender: true,
  npmCDN: "https://cdn.jsdelivr.net/npm",

  license: {
    label: "CC-BY-4.0",
    href: "https://creativecommons.org/licenses/by/4.0/",
  },
}

export const PROFILE: ProfileConfig = {
  name: "Christopher Weber",
  // ProfileConfigSchema caps tagline and location at 50 characters each.
  tagline: "Political psychology · behavior · voter files",
  email: "chrisweber@arizona.edu",
  location: "333 Social Sciences Building, Tucson, AZ",
  links: {
    email: "mailto:chrisweber@arizona.edu",
    github: "https://github.com/crweber9874",
    website: {
      href: "https://voterproject.arizona.edu",
      label: "Arizona Voter Project",
    },
    cv: "/cv",
  },
  linksPlacement: {
    header: ["email", "github"],
    about: true,
    footer: true,
  },
}

export const NAV_LINKS: LinkConfig[] = [
  { href: "/publications", label: "Publications" },
  { href: "/teaching", label: "Teaching" },
  { href: "/projects", label: "Projects" },
  { href: "/cv", label: "CV" },
]

export const NAVIGATION: LinkConfig[] = NAV_LINKS.map(({ href, label }) => ({
  href,
  label,
}))

export const PUB_CONFIG: PublicationConfig = {
  maxFirstAuthors: 6,
  maxLastAuthors: 1,
  highlightAuthor: {
    firstName: "Christopher",
    lastName: "Weber",
    aliases: ["C. Weber", "Christopher R. Weber"],
  },
  equalSymbols: {
    first: "*",
    second: "†",
    third: "‡",
    last: "§",
  },
}

export const FOOTER: FooterConfig = {
  credits: true,
  sourceCode: "https://github.com/crweber9874",
  footerLinks: [],
}

if (import.meta.env.DEV && typeof window === "undefined") {
  const {
    FooterConfigSchema,
    ProfileConfigSchema,
    PublicationConfigSchema,
    SiteConfigSchema,
  } = await import("@/schemas")
  SiteConfigSchema.parse(SITE)
  ProfileConfigSchema.parse(PROFILE)
  FooterConfigSchema.parse(FOOTER)
  PublicationConfigSchema.parse(PUB_CONFIG)
}
