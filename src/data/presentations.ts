export interface Presentation {
  title: string;
  subtitle?: string;
  /** ISO date of the talk. */
  date: string;
  venue?: string;
  authors?: string;
  description: string;
  /** Folder name under decks/; served at /decks/<slug>/. */
  slug: string;
  repo?: string;
}

/**
 * Decks are rendered self-contained and copied into decks/<slug>/; the
 * prebuild step (scripts/sync-decks.mjs) publishes them to public/decks/.
 * Newest first.
 */
export const presentations: Presentation[] = [
  {
    title: "The Measurement Characteristics of Electoral Contestation",
    date: "2026-10-22",
    venue:
      "Western States Political Psychology Conference · University of New Mexico, Albuquerque",
    authors:
      "Christopher R. Weber, Juliet E. Carlisle, Christopher F. Karpowitz, Fabian G. Neuner, Mark D. Ramirez",
    description:
      "Seven surveys, 2020–2024: how much Americans support contesting election results, whether traditional and expressive contestation form one dimension or two, how stable those beliefs are across waves, and whether they track perceived party norms.",
    slug: "wsppc-2026-contestation",
  },
  {
    title: "The Arizona Electorate in 2026",
    subtitle: "Registration and Voting",
    date: "2026-10-20",
    description:
      "Arizona's voter file, county by county and district by district: party registration, the growth of the unaffiliated electorate, early voting, and registration among the citizen voting-age population.",
    slug: "az-registration",
  },
];
