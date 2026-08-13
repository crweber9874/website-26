// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import UnoCSS from "unocss/vite";
import siteConfig from "./src/side.config";
import { withTrailingSlash } from "./src/lib/site-url";

export default defineConfig({
	site: withTrailingSlash(siteConfig.siteUrl),
	integrations: [react(), sitemap()],
	vite: {
		build: {
			assetsInlineLimit: 0,
		},
		plugins: [UnoCSS()],
	},
	image: {
		responsiveStyles: true,
	},
	prefetch: {
		prefetchAll: true,
		defaultStrategy: "hover",
	},
});
