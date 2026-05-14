export type EnrichmentTestPerson = {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  eventContext: string;
  publicProfileUrl?: string;
  companyUrl?: string;
  consentedPhotoUrl?: string;
  expectedData: string[];
};

export const enrichmentTestLists: Record<string, EnrichmentTestPerson[]> = {
  "edutech-startup-event": [
    {
      id: "edu-1",
      name: "John Tan",
      email: "john@relo.example",
      company: "Relo",
      title: "Founder",
      eventContext: "Edutech startup event",
      companyUrl: "https://relo.example",
      consentedPhotoUrl: "https://i.pravatar.cc/160?u=john-tan-relo",
      expectedData: ["founder background", "partnership angle", "company news", "education network overlap"],
    },
    {
      id: "edu-2",
      name: "Charisse Li",
      email: "charisse@manus.example",
      company: "Manus AI",
      title: "Operator",
      eventContext: "Edutech startup event",
      companyUrl: "https://manus.example",
      consentedPhotoUrl: "https://i.pravatar.cc/160?u=charisse-li-manus",
      expectedData: ["company focus", "AI workflow angle", "recent industry news", "warm intro path"],
    },
    {
      id: "edu-3",
      name: "Lee Yang Sean",
      email: "sean@learninglab.example",
      company: "LearningLab",
      title: "Product Lead",
      eventContext: "Singapore edutech founder meetup",
      companyUrl: "https://learninglab.example",
      consentedPhotoUrl: "https://i.pravatar.cc/160?u=lee-yang-sean",
      expectedData: ["Singapore market context", "edutech focus", "operator needs", "conversation opener"],
    },
  ],
  "investor-founder-summit": [
    {
      id: "inv-1",
      name: "Maya Patel",
      email: "maya@orbit.example",
      company: "Orbit AI",
      title: "Founder & CEO",
      eventContext: "Founder/investor summit",
      companyUrl: "https://orbit.example",
      consentedPhotoUrl: "https://i.pravatar.cc/160?u=maya-orbit",
      expectedData: ["fundraising stage", "investor fit", "customer proof", "follow-up ask"],
    },
    {
      id: "inv-2",
      name: "Jon Bell",
      email: "jon@forge.example",
      company: "Forge Capital",
      title: "Partner",
      eventContext: "Founder/investor summit",
      companyUrl: "https://forge.example",
      consentedPhotoUrl: "https://i.pravatar.cc/160?u=jon-forge",
      expectedData: ["investment thesis", "portfolio overlap", "intro angle", "avoid generic pitch"],
    },
  ],
};
