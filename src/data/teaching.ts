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
  description: string;
  topics: string[];
  /** Same-origin path under this site (e.g. /pedagogy/pol682/). */
  url?: string;
  repo?: string;
  embed: boolean;
  status?: string;
  /** Accompanying texts the course is built around. */
  coreTexts?: CoreText[];
}

export const courses: Course[] = [
  {
    code: "POL 682",
    title: "Linear Regression Analysis",
    subtitle: "Graduate methods · University of Arizona",
    description:
      "A course reader for the first graduate regression sequence: the linear model from the ground up — OLS, the Gauss–Markov assumptions, inference, diagnostics, and reproducible workflows in R. It accompanies the textbooks below; many concepts and formulas are drawn from those sources.",
    topics: ["OLS", "Inference", "Diagnostics", "Reproducibility", "R / tidyverse"],
    url: "/pedagogy/pol682/",
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
    subtitle: "Graduate methods · University of Arizona",
    description:
      "A course reader for the second-semester methods sequence: limited dependent variables, count and ordered outcomes, simulation, hierarchical models, and causal inference. It accompanies the textbooks below; many concepts and formulas are drawn from those sources.",
    topics: [
      "Logit / probit",
      "Count models",
      "Causal inference",
      "Simulation",
      "Hierarchical models",
    ],
    url: "/pedagogy/pol683/",
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
