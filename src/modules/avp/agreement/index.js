export { default as AgreementPage, metadata } from "./AgreementPage";
export { default as Agreement } from "./components/Agreement";
export { loadAgreement } from "./lib/agreement";

export const moduleMeta = {
  id: "agreement",
  title: "Common Ground",
  href: "/agree",
  nav: { label: "Common Ground", group: "Public opinion" },
};
