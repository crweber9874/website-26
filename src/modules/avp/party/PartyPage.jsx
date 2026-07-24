import PartyModule from "@/modules/avp/party/components/PartyModule";
import { loadContent } from "@/modules/avp/shared/lib/content";

export const metadata = { title: "Party transitions · AVP" };

export default function PartyPage() {
  const { sections } = loadContent("party");
  return <PartyModule copy={sections} />;
}
