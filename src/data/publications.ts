export type PubType = "book" | "article" | "chapter" | "reference";

export interface Publication {
  title: string;
  authors: string;
  year: string;
  venue: string;
  doi?: string;
  amazon?: string;
  /** Full abstract where available; otherwise a concise editorial summary. */
  abstract: string;
  /** true when `abstract` is a short editorial summary rather than the published abstract. */
  summary?: boolean;
  /** Featured on the Research page (high-impact venue and/or recent). */
  selected?: boolean;
  type: PubType;
}

export interface Theme {
  id: string;
  title: string;
  blurb: string;
  publications: Publication[];
}

export const doiUrl = (doi: string) => `https://doi.org/${doi}`;

export const themes: Theme[] = [
  {
    id: "political-psychology",
    title: "Ideology & Political Psychology",
    blurb:
      "Authoritarianism, ideology, moral intuition, emotion, and identity — the psychological forces that structure how citizens sort, reason, and vote.",
    publications: [
      {
        title:
          "The Authoritarian Divide: Partisan Identity, Voting, and the Transformation of the American Electorate",
        authors: "Christopher M. Federico, Stanley Feldman, and Christopher Weber",
        year: "2026",
        venue: "Oxford University Press · Series in Political Psychology",
        amazon: "https://www.amazon.com/dp/0197813348",
        selected: true,
        type: "book",
        summary: true,
        abstract:
          "The Authoritarian Divide shows how authoritarian predispositions — desires for social and in-group conformity — have increasingly structured American political preferences, voting, and partisanship over recent decades. Drawing on nationally representative samples, panel data, and experiments, the authors trace how voters have sorted into parties by their levels of authoritarianism (higher toward the Republican Party, lower toward the Democratic), revealing complexities including the outsized effect on White Americans, dependence on the choices parties offer, and the role of education. The analysis carries crucial implications for partisan conflict and the future of American democracy.",
      },
      {
        title: "Authoritarianism and Political Conflict",
        authors: "Stanley Feldman and Christopher Weber",
        year: "2024",
        venue: "The Oxford Handbook of Political Psychology",
        doi: "10.1093/oxfordhb/9780197541302.013.19",
        selected: true,
        type: "chapter",
        abstract:
          "We review recent research on authoritarianism with the goal of addressing major issues of conceptualization, measurement, and political consequences. We highlight a conceptualization of authoritarianism that identifies the desire for social cohesion and defense of ingroup norms as central to its dynamics. The consequences of authoritarianism—intolerance of dissent, out-group animosity, and support for anti-democratic leaders and parties—result from the experience of threat to social cohesion among those with authoritarian predispositions. Threats may be associated with processes of social change (changing gender norms) or changes to the status of the majority group from immigration. The role of threat helps provide a basis for understanding the conditions under which authoritarianism becomes a politically potent force.",
      },
      {
        title: "Ideology in Vietnam: Evidence from Asian Barometer Data",
        authors: "Paul Schuler, Mai Truong, and Christopher Weber",
        year: "2023",
        venue: "20th Anniversary of the ABS, Commemorative Volume",
        type: "chapter",
        summary: true,
        abstract:
          "Using Asian Barometer Survey data, this chapter examines the structure and correlates of ideology in Vietnam, extending questions about authoritarian dispositions and redistribution to a single-party, left-authoritarian context.",
      },
      {
        title:
          "Why Are We Divided? Understanding the Social and Ideological Foundations of Partisan Sorting and Polarization",
        authors: "Christopher Weber and Samara Klar",
        year: "2019",
        venue: "Advances in Political Psychology, 40, 215–244",
        doi: "10.1111/pops.12574",
        selected: true,
        type: "article",
        abstract:
          "Americans are sorting ideologically: liberals and conservatives are more likely to respectively identify as Democrats and Republicans. They are sorting socially as well: partisans like and trust copartisans more than opposing partisans. Existing explanations rely on exogenous factors such as elite polarization, but these cannot fully explain variation in sorting. We argue that psychological characteristics help explain the tendency to sort ideologically or socially—specifically, an individual's responsiveness to internal values versus normative social pressures. Testing this with several nationally representative surveys and a survey experiment, we find strong support that a person's own tendency to respond to social cues, as opposed to ideological values, has important consequences for this process.",
      },
      {
        title: "Affective Consistency and Sorting",
        authors: "Nicholas T. Davis, Samara Klar, and Christopher Weber",
        year: "2019",
        venue: "Social Science Quarterly, 100(6), 2477–2494",
        doi: "10.1111/ssqu.12695",
        selected: true,
        type: "article",
        abstract:
          "Sorting is often portrayed as a mechanistic response to elite polarization: individuals recognize salient differences between the parties and match their preferences accordingly. Much less is known about the psychological and motivational processes that contribute to it. Analyzing cross-sectional and panel data from the American National Election Studies, we find that negative emotions directed toward the opposing party candidate and positive emotions toward one's own party candidate are associated with an increase in the alignment of ideological and partisan preferences—illustrating how affect contributes to consistency in mass opinion.",
      },
      {
        title: "Ideology and Values",
        authors: "Christopher Weber",
        year: "2019",
        venue: "Oxford Encyclopedia of Political Decision Making",
        type: "reference",
        summary: true,
        abstract:
          "A peer-reviewed encyclopedia entry synthesizing scholarship on the nature of ideology and core values, and their role in political decision making.",
      },
      {
        title:
          "Placing Racial Stereotypes in Context: Social Desirability and the Politics of Racial Hostility",
        authors:
          "Christopher Weber, Howard Lavine, Leonie Huddy, and Christopher M. Federico",
        year: "2014",
        venue: "American Journal of Political Science, 58(1), 63–78",
        doi: "10.1111/ajps.12051",
        selected: true,
        type: "article",
        abstract:
          "Past research indicates that diversity at the level of larger geographic units is linked to white racial hostility, but research has not addressed whether diverse local contexts strengthen or weaken the relationship between racial stereotypes and policy attitudes. In a statewide opinion survey, we find that black-white diversity at the zip-code level strengthens the connection between racial stereotypes and race-related policy attitudes among whites—an effect most pronounced among low self-monitors, who are relatively immune to egalitarian social norms. The racializing effect is most evident for stereotypes relevant to a given policy.",
      },
      {
        title:
          "Mapping the Connections between Politics and Morality: The Multiple Sociopolitical Orientations Involved in Moral Intuition",
        authors:
          "Christopher M. Federico, Christopher Weber, Damla Ergun, and Corrie Hunt",
        year: "2013",
        venue: "Political Psychology, 34(4), 589–610",
        doi: "10.1111/pops.12006",
        selected: true,
        type: "article",
        abstract:
          "According to moral foundations theory, five foundations are central to moral intuition: the individualizing foundations (harm/care and fairness/reciprocity) hinge on the rights of the individual, whereas the binding foundations (in-group/loyalty, authority/respect, and purity/sanctity) focus on communal bonds. We argue that only certain sociopolitical attitudes relate to each cluster. Drawing on dual-process models, we show the individualizing foundations align with preferences for equality versus inequality (SDO and competitive-jungle beliefs), whereas the binding foundations align with preferences for openness versus social conformity (RWA and dangerous-world beliefs).",
      },
      {
        title: "Moral Foundations and Heterogeneity in Ideological Preferences",
        authors: "Christopher Weber and Christopher M. Federico",
        year: "2013",
        venue: "Political Psychology, 34(1), 107–126",
        doi: "10.1111/j.1467-9221.2012.00922.x",
        selected: true,
        type: "article",
        abstract:
          "Moral foundations theory contends that divisions between liberals and conservatives are rooted in different views of morality, with liberals disproportionately valuing the individualizing foundations while conservatives value all five more equally. We extend this by examining whether different types of liberals and conservatives value the foundations to varying degrees. Using survey data (n = 745) and a mixed-mode latent class analysis, we identify six ideological classes that favor unique social and fiscal policy positions and endorse the moral foundations in varying degrees—demonstrating considerable heterogeneity in ideology and moral preferences.",
      },
      {
        title: "Emotions, Campaigns, and Political Participation",
        authors: "Christopher Weber",
        year: "2013",
        venue: "Political Research Quarterly, 66(2), 414–428",
        doi: "10.1177/1065912912449697",
        selected: true,
        type: "article",
        abstract:
          "There has been a scarcity of work examining the political consequences of discrete emotions. This article examines the political effects of anger, sadness, fear, and enthusiasm. Two experiments are administered: the first examines emotional responses to campaign messages; the second tests whether emotions influence political participation. The results indicate anger is mobilizing, increasing participatory intentions and related factors—a result then replicated using ad-tracking data. Emotions are an important factor in studying campaign effects.",
      },
      {
        title: "Genetics, Personality, and Group Identity",
        authors: "Christopher Weber, Martin Johnson, and Kevin Arceneaux",
        year: "2011",
        venue: "Social Science Quarterly, 92(5), 1314–1337",
        doi: "10.1111/j.1540-6237.2011.00820.x",
        type: "article",
        abstract:
          "We investigate why people identify with groups and show favoritism to in-group members, anticipating that group identifications are substantially influenced by genes and social environments, likely working through stable personality traits. Using twin-study data from the National Survey of Midlife Development (MIDUS I), we examine the heritability of in-group identification and favoritism and the extent to which their genetic bases are shared with the Big Five personality traits. Group identification is largely attributable to genetic factors, though environments also matter; personality heritability accounts for a modest portion of the genetic variation.",
      },
      {
        title: "Emotion, Attribution, and Attitudes Towards Crime",
        authors: "Erin Cassese and Christopher Weber",
        year: "2011",
        venue: "Journal of Integrated Social Sciences, 2(1), 63–97",
        type: "article",
        summary: true,
        abstract:
          "Examines how discrete emotions and causal attributions jointly shape public attitudes toward crime and punishment, linking affective responses to preferences over punitive policy.",
      },
      {
        title: "Who Said What? The Effects of Source Cues in Issue Frames",
        authors: "Todd K. Hartman and Christopher Weber",
        year: "2009",
        venue: "Political Behavior, 31(4), 537–558",
        doi: "10.1007/s11109-009-9088-y",
        type: "article",
        summary: true,
        abstract:
          "Experiments examining how the source attached to an issue frame shapes its persuasive impact, showing that the identity and credibility of the source condition framing effects on opinion.",
      },
      {
        title: "Interpersonal Attachment and Patterns of Ideological Belief",
        authors: "Christopher Weber and Christopher M. Federico",
        year: "2007",
        venue: "Political Psychology, 28(4), 389–416",
        doi: "10.1111/j.1467-9221.2007.00579.x",
        type: "article",
        abstract:
          "We examine whether two general dimensions of sociopolitical belief—right-wing authoritarianism (RWA) and social dominance orientation (SDO)—are rooted in insecure psychological attachment. A structural equation model indicated that anxious attachment led to RWA but not SDO, mediated by the belief that the world is a dangerous place; avoidant attachment led to SDO but not RWA, mediated by the belief that the world is an uncaring, competitive jungle. We discuss the implications for the nature and origins of political conservatism.",
      },
      {
        title: "The Political Consequences of Perceived Threat and Felt Insecurity",
        authors: "Leonie Huddy, Stanley Feldman, and Christopher Weber",
        year: "2007",
        venue:
          "The ANNALS of the American Academy of Political and Social Science",
        doi: "10.1177/0002716207305951",
        type: "chapter",
        abstract:
          "Drawing on a national telephone sample of 1,549 adult Americans conducted between October 2001 and March 2002, we explore the impact of a need for security on support for national security policies after the 9/11 attacks. We examine support for protective government policies among individuals who vary in their ability to feel secure, exploring the interaction between perceived threat and felt security. Most Americans reported a sense of security after 9/11, but a sense of insecurity among a minority coupled with a perceived threat of future terrorism increased support for both domestic and international security policy—the curtailment of civil liberties, tougher visa checks, and support for the war in Afghanistan. Our findings underscore the diverse ways individuals react politically to a common external threat.",
      },
      {
        title:
          "First Steps Towards a Dual-Process Accessibility Model of Political Beliefs, Attitudes, and Behavior",
        authors: "Milton Lodge, Charles Taber, and Christopher Weber",
        year: "2006",
        venue: "Feeling Politics (ed. David Redlawsk), Palgrave Macmillan, 10–30",
        doi: "10.1057/9781403983114_2",
        type: "chapter",
        summary: true,
        abstract:
          "An early statement of a dual-process, accessibility-based model of political cognition, arguing that automatic affective responses precede and shape conscious evaluation of political beliefs, attitudes, and behavior.",
      },
    ],
  },
  {
    id: "methods",
    title: "Methods",
    blurb:
      "Research design and measurement for opinion dynamics — repeated cross-sections, online experimental samples, social-desirability bias, and discussion networks.",
    publications: [
      {
        title: "The Characteristics of Interpersonal Networks in Disaster Response",
        authors: "Christopher Kenny, Christopher Weber, and Kathleen Bratton",
        year: "2017",
        venue: "Social Science Quarterly, 98(2), 566–583",
        doi: "10.1111/ssqu.12328",
        type: "article",
        abstract:
          "Discussion networks have meaningful consequences for sociopolitical attitudes and behavior. We explore how social structure shapes reactions to disaster—specifically, the 2010 BP oil spill—by experimentally varying the commonly used discussion 'name-generator' questions. Relative to 'important matters' discussants, we find strong support for a specialist model: oil spill discussants tend to be less intimate, more knowledgeable, more active, and more talkative about the spill, suggesting a contextual basis for the formation of and reliance on discussion networks.",
      },
      {
        title: "Social Desirability Bias in the 2016 Presidential Election",
        authors: "Samara Klar, Christopher Weber, and Yanna Krupnikov",
        year: "2016",
        venue: "The Forum, 14(4), 433–443",
        doi: "10.1515/for-2016-0037",
        selected: true,
        type: "article",
        abstract:
          "Partisanship is a stable trait, but expressions of partisan preferences can vary according to social context. Relying on the psychological trait of self-monitoring, we show that Americans more likely to adjust their behavior to comply with social norms (high self-monitors) were less likely to express support for Donald Trump during the 2016 election; as self-monitoring decreases, the tendency to express Trump support increases. This suggests that—at least for some individuals—there may have been a tendency to repress expressed support for Trump to mask socially undesirable attitudes.",
      },
      {
        title: "An Effective Approach to the Repeated Cross-Sectional Design",
        authors: "Matthew Lebo and Christopher Weber",
        year: "2015",
        venue: "American Journal of Political Science, 59(1), 242–258",
        doi: "10.1111/ajps.12095",
        selected: true,
        type: "article",
        abstract:
          "Repeated cross-sectional (RCS) designs are distinguishable from true panels and pooled cross-sectional time series because cross-sectional units appear only once. This poses two challenges: autocorrelation threatens inferences, yet common solutions like lagged dependent variables are impossible; and available methods force a choice between aggregate- and individual-level analysis. We offer a solution—double filtering with ARFIMA methods to account for autocorrelation, followed by multilevel modeling to estimate aggregate- and individual-level parameters simultaneously—demonstrated with Monte Carlo experiments and three applied examples.",
      },
      {
        title:
          "Socially-Mediated Internet Surveys (SMIS): Recruiting Participants for Online Experiments",
        authors:
          "Erin Cassese, Leonie Huddy, Todd Hartman, Lilliana Mason, and Christopher Weber",
        year: "2013",
        venue: "PS: Political Science & Politics, 46(4), 775–784",
        doi: "10.1017/s1049096513001029",
        type: "article",
        abstract:
          "The Socially Mediated Internet Survey (SMIS) method is a cost-effective technique for obtaining web-based adult samples for experimental research, engaging central figures in online social networks to help recruit participants. We present data from six SMIS samples and compare them to approaches such as Amazon's Mechanical Turk. While not representative of the general adult population, SMIS samples are significantly more diverse than undergraduate convenience samples—demographically and politically—and can capture highly engaged citizens, helping to address concerns about the artificiality of student-based experiments.",
      },
    ],
  },
];

// Flattened, newest-first list (used by the full CV).
export const allPublications: Publication[] = themes
  .flatMap((t) => t.publications)
  .sort((a, b) => Number(b.year) - Number(a.year));

// Themes containing only the selected (featured) publications.
export const selectedThemes: Theme[] = themes
  .map((t) => ({ ...t, publications: t.publications.filter((p) => p.selected) }))
  .filter((t) => t.publications.length > 0);

// The featured book.
export const featuredBook = themes[0].publications.find((p) => p.type === "book")!;
