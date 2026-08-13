/**
 * Scholar Pages — primary configuration
 *
 * Identity, profile, links, and page introductions live here.
 * Publications, CV records, projects, and courses live in src/data.
 */
import { defineSiteConfig } from "./src/config/site";

export const siteConfig = defineSiteConfig({
	author: "Christopher Weber",
	siteUrl: "https://christopher-weber.com",
	hero: {
		headline:
			"Political psychology, political behavior, and the data science of voter files.",
		subheadline:
			"I am a Professor in the School of Government and Public Policy at the University of Arizona, where I direct The Arizona Voter Project. My work spans authoritarianism and ideology, campaigns and emotion, measurement and research design.",
		// Placeholder monogram — replace public/profile.svg with a headshot.
		profileImage: "/profile.svg",
		profileAlt: "Christopher Weber",
	},

	// Social platforms handle raster cards far better than SVG, so the OG image
	// is set explicitly rather than falling back to the profile image.
	ogImage: "/img/social-preview.png",
	ogImageAlt: "Christopher Weber — Professor of Political Science, University of Arizona",
	ogImageWidth: 1200,
	ogImageHeight: 630,

	description:
		"Christopher Weber — Professor of Political Science, University of Arizona. Political psychology, political behavior, and the Arizona Voter Project.",
	keywords: [
		"political psychology",
		"political behavior",
		"authoritarianism",
		"polarization",
		"voter file",
		"Arizona Voter Project",
		"political methodology",
	],
	affiliations: [
		{
			role: "Professor of Political Science",
			institution: "School of Government and Public Policy, University of Arizona",
		},
		{
			role: "Director",
			institution: "The Arizona Voter Project",
		},
	],
	researchInterests: [
		"Authoritarianism",
		"Ideology & Moral Foundations",
		"Partisan Sorting & Polarization",
		"Emotion & Campaigns",
		"Measurement & Research Design",
		"Voter File Data Science",
	],
	socialLinks: [
		{
			label: "Email",
			href: "mailto:chrisweber@arizona.edu",
			icon: "i-mdi:email-outline",
		},
		{
			label: "GitHub",
			href: "https://github.com/crweber9874",
			icon: "i-mdi:github",
		},
		{
			label: "Arizona Voter Project",
			href: "https://voterproject.arizona.edu",
			icon: "i-mdi:vote-outline",
		},
	],

	navLinks: [
		{ href: "/about", label: "About" },
		{ href: "/researches", label: "Publications" },
		{ href: "/voter", label: "Voter Project" },
		{ href: "/teaching", label: "Teaching" },
		{ href: "/projects", label: "Projects" },
		{ href: "/cv", label: "CV" },
	],

	pageTitles: {
		about: {
			title: "About",
			description:
				"Appointments, education, service, honors, and recent media.",
		},
		researches: {
			title: "Publications",
			description:
				"Peer-reviewed articles, book chapters, and books on political psychology, political behavior, and research methods, plus manuscripts in preparation.",
		},
		projects: {
			title: "Projects",
			description:
				"The Arizona Voter Project and the graduate methods course readers.",
		},
		teaching: {
			title: "Teaching",
			description:
				"Graduate methods course readers, written to accompany the standard texts rather than replace them.",
		},
		posts: {
			title: "Notes",
			description: "Research notes and updates.",
		},
	},

	homeBlocks: {
		hero: { enabled: true },
		publications: { enabled: true },
		posts: { enabled: false },
	},
});

export default siteConfig;
