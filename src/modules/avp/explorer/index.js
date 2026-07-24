export { default as ExplorerPage } from "./ExplorerPage";
export { default as SearchPage } from "./SearchPage";
export { default as StoryPage } from "./StoryPage";
export { default as Explorer } from "./components/Explorer";
export { default as SearchApp } from "./components/SearchApp";
export { default as Story } from "./components/Story";
export { default as ChoroplethMap } from "./components/ChoroplethMap";
export { default as LocatePanel } from "./components/LocatePanel";
export { default as TimeSeriesCompare } from "./components/TimeSeriesCompare";
export { loadCd } from "./lib/data";
export { geoidForGeo, GEO_TO_GEOID_KEY, GEOID_KEY_TO_GEO } from "./lib/geocode";

export const moduleMeta = {
  id: "explorer",
  title: "Democracy through Data",
  routes: [
    { href: "/explorer", label: "Democracy through Data" },
    { href: "/search", label: "Search" },
    { href: "/story", label: "Story" },
  ],
  nav: { label: "Democracy through Data", group: "Democracy through Data" },
};
