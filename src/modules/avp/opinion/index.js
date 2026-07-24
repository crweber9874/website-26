export { default as OpinionPage, metadata } from "./OpinionPage";
export { default as Opinion } from "./components/Opinion";
export { loadOpinion } from "./lib/opinion";

export const moduleMeta = {
  id: "opinion",
  title: "Public Opinion",
  href: "/opinion",
  nav: { label: "Opinion", group: "Public opinion" },
};
