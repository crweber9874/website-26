export interface CoreText {
  authors: string;
  year: string;
  title: string;
  publisher: string;
}

export interface Course {
  code: string;
  title: string;
  subtitle: string;
  /** One paragraph: what the course is about. */
  description: string;
  /** What the reader actually covers, in reading order. */
  covers: string[];
  topics: string[];
  /** Same-origin path under this site (e.g. /teaching/pol682/). */
  url?: string;
  repo?: string;
  embed: boolean;
  status?: string;
  /** Textbooks the reader is written to accompany. */
  coreTexts?: CoreText[];
}

/**
 * The readers themselves are authored in the methodology_ground_up repo and
 * synced into public/teaching/ by scripts/sync-readers.sh — the rendered HTML
 * under public/teaching/ is not edited here.
 */
export const courses: Course[] = [
  {
    code: "POL 682",
    title: "Linear Regression Analysis",
    subtitle: "Graduate methods · Fall · University of Arizona",
    description:
      "First semester. The linear model from the ground up: least squares, the Gauss–Markov assumptions, inference, and what to do when the assumptions fail. Worked in R throughout, with a reproducible workflow.",
    covers: [
      "Foundations: simple regression, BLUE, estimation, and the matrix form of the model.",
      "Inference: variable selection, interactions, and interpretation.",
      "When assumptions fail: heteroskedasticity, multicollinearity, autocorrelation, measurement error, and endogeneity.",
      "Applications: panel data, plus a documented data appendix.",
    ],
    topics: ["OLS", "Inference", "Diagnostics", "Reproducibility", "R / tidyverse"],
    url: "/teaching/pol682/",
    embed: true,
    coreTexts: [
      {
        authors: "Fox, John",
        year: "2016",
        title:
          "Applied Regression Analysis and Generalized Linear Models (3rd ed.)",
        publisher: "Sage",
      },
      {
        authors: "Fox, John, and Sanford Weisberg",
        year: "2019",
        title: "An R Companion to Applied Regression (3rd ed.)",
        publisher: "Sage",
      },
      {
        authors: "Gelman, Andrew, and Jennifer Hill",
        year: "2007",
        title:
          "Data Analysis Using Regression and Multilevel/Hierarchical Models",
        publisher: "Cambridge University Press",
      },
    ],
  },
  {
    code: "POL 683",
    title: "Advanced Regression & Causal Inference",
    subtitle: "Graduate methods · Spring · University of Arizona",
    description:
      "Second semester. What to do when the outcome is not continuous and the design is not experimental: limited dependent variables, simulation as a tool for understanding models, and the causal inference toolkit.",
    covers: [
      "Inference and matrix algebra, revisited as the working language of the sequence.",
      "Limited dependent variables: binary, ordinal, multicategory, and count outcomes.",
      "Simulation for interpretation, prediction, and uncertainty.",
      "Causal inference and model fit.",
    ],
    topics: [
      "Logit / probit",
      "Count models",
      "Causal inference",
      "Simulation",
      "Hierarchical models",
    ],
    url: "/teaching/pol683/",
    embed: true,
    coreTexts: [
      {
        authors: "Long, J. Scott",
        year: "1997",
        title:
          "Regression Models for Categorical and Limited Dependent Variables",
        publisher: "Sage",
      },
      {
        authors: "McElreath, Richard",
        year: "2020",
        title:
          "Statistical Rethinking: A Bayesian Course with Examples in R and Stan (2nd ed.)",
        publisher: "CRC Press",
      },
      {
        authors:
          "Gelman, Andrew, John Carlin, Hal Stern, David Dunson, Aki Vehtari, and Donald Rubin",
        year: "2014",
        title: "Bayesian Data Analysis (3rd ed.)",
        publisher: "CRC Press",
      },
    ],
  },
];
