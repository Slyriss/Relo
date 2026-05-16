import { expect, test } from "./fixtures";

const lookupResult = {
  enrichment: {
    attendeeId: "manual-charisse-li",
    confidence: 0.82,
    signals: [],
    sources: [],
    summary: "Live source discovery completed.",
    updatedAt: new Date().toISOString(),
  },
  news: [
    {
      title: "Manus AI event coverage",
      url: "https://example.com/manus-ai",
      source: "example.com",
      publishedAt: "2026-05-12T00:00:00.000Z",
      snippet: "Recent public coverage returned by source provider.",
    },
  ],
  researchBrief: {
    summary: "Charisse Li has source-backed context around Manus AI and event marketing.",
    actionPlan: {
      approach: "Approach with the social impact event context and ask what made the session relevant before mentioning your own goal.",
      opener: "Hi Charisse, I saw your work around Manus AI and social impact programming. What has been most useful for you here today?",
      talkingPoints: ["Reference the event theme first.", "Use Manus AI only as a light bridge.", "Ask what kinds of partners or builders are useful for her."],
      questions: ["What brought you to this event?", "What kinds of projects are most interesting right now?", "Who would be useful for you to meet here?"],
      offer: "Offer one relevant intro or event insight based on her answer.",
      followUp: "Send a concise note with the intro, resource, or question discussed.",
      avoid: ["Do not lead with a hard pitch.", "Do not overstate public source confidence."],
    },
    findings: ["A LinkedIn source was returned.", "One public article was found."],
    sourceNotes: ["Source set is live-search backed."],
    followUpQuestions: ["Confirm current role before outreach."],
  },
  sources: [
    {
      type: "linkedin",
      title: "Charisse Li LinkedIn profile",
      url: "https://sg.linkedin.com/in/charisse-li",
      source: "sg.linkedin.com",
      verified: true,
    },
  ],
  sourceStatus: "Live web source discovery completed with TinyFish and Brave Search.",
  sourceProvider: "multi",
  context: "Social impact event",
};

test("unauthenticated setup never renders a blank page", async ({ page }) => {
  await page.goto("/setup");
  await expect(page).toHaveURL(/\/login\?next=%2Fsetup|\/login\?next=\/setup|\/setup/);
  await expect(page.locator("body")).not.toBeEmpty();
});

test("unknown routes show branded 404", async ({ page }) => {
  await page.goto("/definitely-not-a-real-relo-page");
  await expect(page.getByRole("link", { name: /R Relo/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /not available/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
});

test("admin CRM does not expose raw XSS-like notes", async ({ authedPage: page }) => {
  await page.goto("/dashboard/contacts");
  await expect(page.getByRole("heading", { name: /crm network/i })).toBeVisible();
  await expect(page.getByText("<img src=x onerror=alert('xss-meeting')>")).toHaveCount(0);
  await expect(page.getByText("Maya is raising in Q3").first()).toBeVisible();
});

test("admin profile upload controls do not overlap at laptop width", async ({ authedPage: page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/settings/profile");
  const input = page.locator('input[type="file"]').first();
  const upload = page.getByRole("button", { name: /upload/i }).first();
  await expect(input).toBeVisible();
  await expect(upload).toBeVisible();

  const inputBox = await input.boundingBox();
  const buttonBox = await upload.boundingBox();
  expect(inputBox).not.toBeNull();
  expect(buttonBox).not.toBeNull();
  expect(inputBox!.x + inputBox!.width).toBeLessThanOrEqual(buttonBox!.x + 4);
});

test("research job survives navigation and renders actionables", async ({ authedPage: page }) => {
  await page.route("**/api/lookup/jobs", async (route) => {
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ id: "job-1", status: "running", label: "Charisse Li - Manus AI" }),
    });
  });
  await page.route("**/api/lookup/jobs/job-1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "completed", result: lookupResult }),
    });
  });

  await page.goto("/dashboard/lookup");
  await page.getByLabel("Person name").fill("Charisse Li");
  await page.getByLabel("Company").fill("Manus AI");
  await page.getByLabel("What should the research answer?").fill("How can I approach her at a social impact event?");
  await page.getByRole("button", { name: /run research/i }).click();
  await expect(page.getByText(/research keeps running/i)).toBeVisible();
  await page.getByRole("link", { name: /event control/i }).click();
  await page.getByRole("link", { name: /research desk/i }).click();
  await expect(page.getByRole("heading", { name: /action plan/i })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/what has been most useful/i)).toBeVisible();
  await expect(page.getByText(/do not lead with a hard pitch/i)).toBeVisible();
});
