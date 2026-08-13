import {
	contentLinkSchema,
	contentTextSchema,
	normalizeLinks,
	normalizeStringArray,
	type ContentLink,
} from "./content";
import { z } from "astro/zod";

/**
 * A textbook the reader is written to accompany. Local addition to the theme:
 * these were previously flattened into `highlights`, which mixed "what the
 * course covers" with "what to buy".
 */
export const teachingTextSchema = z
	.object({
		authors: contentTextSchema,
		year: z.union([z.string(), z.number()]).optional(),
		title: contentTextSchema,
		publisher: contentTextSchema.optional(),
	})
	.strict();

export const teachingModuleSchema = z
	.object({
		title: contentTextSchema.optional(),
		code: contentTextSchema.optional(),
		summary: contentTextSchema.optional(),
		tags: z.array(contentTextSchema).optional(),
		badges: z.array(contentTextSchema).optional(),
		highlights: z.array(contentTextSchema).optional(),
		texts: z.array(teachingTextSchema).optional(),
		link: contentLinkSchema.optional(),
		links: z.array(contentLinkSchema).optional(),
	})
	.strict();

export const teachingSectionSchema = z
	.object({
		term: contentTextSchema.optional(),
		modules: z.array(teachingModuleSchema).optional(),
	})
	.strict();

export const teachingDataSchema = z
	.object({
		current: z.array(teachingSectionSchema).optional(),
		past: z.array(teachingSectionSchema).optional(),
	})
	.strict();

export type TeachingModule = z.infer<typeof teachingModuleSchema>;
export type TeachingSection = z.infer<typeof teachingSectionSchema>;
export type TeachingText = z.infer<typeof teachingTextSchema>;

export interface NormalizedTeachingModule extends TeachingModule {
	tags: string[];
	badges: string[];
	highlights: string[];
	texts: TeachingText[];
	links: ContentLink[];
}

export interface NormalizedTeachingSection
	extends Omit<TeachingSection, "modules"> {
	modules: NormalizedTeachingModule[];
}

export function normalizeTeachingModule(
	module: TeachingModule,
): NormalizedTeachingModule {
	return {
		...module,
		tags: normalizeStringArray(module.tags),
		badges: normalizeStringArray(module.badges),
		highlights: normalizeStringArray(module.highlights),
		texts: module.texts ?? [],
		links: normalizeLinks(module.links, module.link),
	};
}

export function normalizeTeachingSection(
	section: TeachingSection,
): NormalizedTeachingSection {
	return {
		...section,
		modules: (section.modules ?? []).map(normalizeTeachingModule),
	};
}
