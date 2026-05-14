import {
  createErrorResult,
  createObservedAt,
  createSkippedResult,
  type EnrichmentAdapterContext,
  type EnrichmentResult,
  type EnrichmentRunOptions,
  type EnrichmentSignal,
  type EnrichmentSubject,
  type PublicEnrichmentAdapter,
} from "./types";

type GitHubUserResponse = {
  login: string;
  name: string | null;
  html_url: string;
  blog: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
};

function normalizeGitHubUsername(subject: EnrichmentSubject): string | undefined {
  if (subject.githubUsername) return subject.githubUsername.replace(/^@/, "").trim();

  const profileUrl = subject.urls?.find((url) => /github\.com\/[^/?#]+/i.test(url));
  if (!profileUrl) return undefined;

  try {
    const parsed = new URL(profileUrl);
    const [username] = parsed.pathname.split("/").filter(Boolean);
    return username;
  } catch {
    return undefined;
  }
}

function userSignals(user: GitHubUserResponse, observedAt: string): EnrichmentSignal[] {
  const profileLabel = user.name ? `${user.name} (@${user.login})` : `@${user.login}`;
  const signals: EnrichmentSignal[] = [
    {
      id: `github:${user.login}:profile`,
      kind: "profile",
      source: "github",
      label: "GitHub profile",
      value: profileLabel,
      url: user.html_url,
      confidence: "high",
      observedAt,
      metadata: {
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    },
    {
      id: `github:${user.login}:public-repos`,
      kind: "repository",
      source: "github",
      label: "Public repositories",
      value: String(user.public_repos),
      url: `${user.html_url}?tab=repositories`,
      confidence: "high",
      observedAt,
    },
    {
      id: `github:${user.login}:followers`,
      kind: "metadata",
      source: "github",
      label: "Follower count",
      value: String(user.followers),
      confidence: "medium",
      observedAt,
      metadata: {
        following: user.following,
      },
    },
  ];

  if (user.company) {
    signals.push({
      id: `github:${user.login}:company`,
      kind: "metadata",
      source: "github",
      label: "Profile company",
      value: user.company,
      confidence: "medium",
      observedAt,
    });
  }

  if (user.blog) {
    signals.push({
      id: `github:${user.login}:blog`,
      kind: "website",
      source: "github",
      label: "Profile website",
      value: user.blog,
      url: user.blog.startsWith("http") ? user.blog : `https://${user.blog}`,
      confidence: "medium",
      observedAt,
    });
  }

  return signals;
}

export const githubPublicProfileAdapter: PublicEnrichmentAdapter = {
  id: "github-public-profile",
  name: "GitHub public profile",
  description: "Fetches public profile metadata from the GitHub REST API for a known username.",
  safety: {
    requiresConsent: false,
    publicDataOnly: true,
    notes: [
      "Only requests GitHub's public user endpoint.",
      "Does not enumerate private data, authenticate as a user, or infer sensitive attributes.",
      "Callers should respect GitHub API rate limits and cache results where appropriate.",
    ],
  },
  canEnrich(subject) {
    return Boolean(normalizeGitHubUsername(subject));
  },
  async enrich(subject, context, options): Promise<EnrichmentResult> {
    const username = normalizeGitHubUsername(subject);
    if (!username) {
      return createSkippedResult(this, subject, "A GitHub username or profile URL is required.", context, options);
    }

    const startedAt = createObservedAt(context, options);

    try {
      const fetchImpl = context?.fetch ?? fetch;
      const response = await fetchImpl(`https://api.github.com/users/${encodeURIComponent(username)}`, {
        headers: {
          Accept: "application/vnd.github+json",
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub profile request failed with HTTP ${response.status}`);
      }

      const user = (await response.json()) as GitHubUserResponse;
      const completedAt = createObservedAt(context, options);

      return {
        adapterId: this.id,
        status: "success",
        subject,
        signals: userSignals(user, completedAt).slice(0, options?.signalLimit),
        safety: this.safety,
        startedAt,
        completedAt,
        metadata: {
          rateLimitRemaining: response.headers.get("x-ratelimit-remaining"),
        },
      };
    } catch (error) {
      return createErrorResult(this, subject, startedAt, error, context, options);
    }
  },
};
