export * from "./adapters";
export * from "./consolidation";
export * from "./external-tool-adapters";
export * from "./github-profile-adapter";
export * from "./types";
export * from "./website-metadata-adapter";

import { externalToolAdapters } from "./external-tool-adapters";
import { githubPublicProfileAdapter } from "./github-profile-adapter";
import { websiteMetadataAdapter } from "./website-metadata-adapter";

export const defaultPublicEnrichmentAdapters = [
  githubPublicProfileAdapter,
  websiteMetadataAdapter,
  ...externalToolAdapters,
];
