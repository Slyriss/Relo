import { expect, test } from "./fixtures";

const EVENT_URL = "/events/relo-summit-2026";

test.describe("event home page", () => {
  test("shows event title, venue, and stats", async ({ participantPage: page }) => {
    await page.goto(EVENT_URL);
    await expect(page.getByRole("heading", { name: "Relo Summit 2026" })).toBeVisible();
    await expect(page.getByText("The Pearl, San Francisco").first()).toBeVisible();
    await expect(page.getByText("People attending")).toBeVisible();
    await expect(page.getByText("Recommended intros")).toBeVisible();
    await expect(page.getByText("Your meetings")).toBeVisible();
  });

  test("See matches link navigates to matches page", async ({ participantPage: page }) => {
    await page.goto(EVENT_URL);
    await page.locator('main a[href$="/matches"]').first().click();
    await expect(page).toHaveURL(/\/events\/[^/]+\/matches$/);
  });

  test("Scan QR link navigates to scan page", async ({ participantPage: page }) => {
    await page.goto(EVENT_URL);
    await page.getByRole("link", { name: /scan/i }).first().click();
    await expect(page).toHaveURL(/\/events\/[^/]+\/scan$/);
  });
});

test.describe("matches page", () => {
  test("shows ranked recommendations list", async ({ participantPage: page }) => {
    await page.goto(`${EVENT_URL}/matches`);
    await expect(page.getByRole("heading", { name: "Matches" })).toBeVisible();
    await expect(page.getByText(/prioritized recommendations/i)).toBeVisible();
    await expect(page.getByText(/top 3 to prioritize now/i)).toBeVisible();
  });

  test("each match card shows a numeric score badge", async ({ participantPage: page }) => {
    await page.goto(`${EVENT_URL}/matches`);
    await expect(page.getByText(/\d+ priority/).first()).toBeVisible();
  });
});

test.describe("scan page", () => {
  test("shows meeting log panel with attendee selector", async ({ participantPage: page }) => {
    await page.goto(`${EVENT_URL}/scan`);
    await expect(page.getByRole("heading", { name: /badge and meeting capture/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Log a meeting", level: 2 })).toBeVisible();
    await expect(page.locator("select").first()).toBeVisible();
    await expect(page.getByPlaceholder(/what did you discuss/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /save meeting and follow-up/i })).toBeVisible();
  });

  test("logs a meeting and shows confirmation status", async ({ participantPage: page }) => {
    await page.goto(`${EVENT_URL}/scan`);

    // Wait for the select to be populated with attendee options
    const select = page.locator("select").first();
    await expect(select).toBeVisible();
    await page.getByPlaceholder(/what did you discuss/i).fill("AI infrastructure");
    await page.getByPlaceholder(/intro, deck, pilot/i).fill("Send a follow-up deck");
    await page.getByPlaceholder(/what should you remember/i).fill("Great conversation about AI infrastructure.");
    await page.getByRole("button", { name: /save meeting and follow-up/i }).click();

    await expect(page.getByText(/meeting logged|saved offline/i)).toBeVisible();
  });
});

test.describe("QR meet page", () => {
  test("shows confirm meeting panel for a specific attendee", async ({ participantPage: page }) => {
    await page.goto("/meet/relo-summit-2026/att-2");
    await expect(page.getByRole("heading", { name: /confirm meeting/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Log a meeting" })).toBeVisible();
  });
});
