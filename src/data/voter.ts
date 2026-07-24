export interface Dashboard {
  n: string;
  title: string;
  href: string;
  blurb: string;
  tag: string;
}

export const dashboards: Dashboard[] = [
  {
    n: "01",
    title: "The Explorer",
    href: "/voter/explorer",
    blurb:
      "Explore characteristics of the Arizona voter file, aggregated to various units.",
    tag: "Choropleth map",
  },
  {
    n: "02",
    title: "Party Transitions",
    href: "/voter/party",
    blurb:
      "A Markov model of monthly movement between party registrations, with steady-state projections and ZIP-level covariates.",
    tag: "Sankey · model",
  },
  {
    n: "03",
    title: "Common Ground",
    href: "/voter/agreement",
    blurb:
      "How much do Arizonans actually overlap? An overlapping-coefficient (OVL) tool measuring shared opinion across party, race, religion, and demographics.",
    tag: "Overlap",
  },
];

export interface SandboxChart {
  title: string;
  src: string;
}

export const sandboxCharts: SandboxChart[] = [
  {
    title: "Party profiles — radar comparison",
    src: "/sandbox/party_radar_comparison_20260315_121108.html",
  },
  {
    title: "Republican share — 3D precinct surface",
    src: "/sandbox/map3d_trump_percent_20260317_111111.html",
  },
  {
    title: "Republican share — precinct density",
    src: "/sandbox/density_pct_republican_20260314_180222.html",
  },
];
