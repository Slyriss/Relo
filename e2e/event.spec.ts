import { expect, test } from "@playwright/test";

const EVENT_URL = "/events/relo-summit-2026";

test.describe("event home page", () => {
  test("shows event title, venue, and stats", async ({ page }) => {
    await page.goto(EVENT_URL);
    await expect(page.getByRole("heading", { name: "Relo Summit 2026" })).toBeVisible();
    await expect(page.getByText("The Pearl, San Francisco")).toBeVisible();
    await expect(page.getByText("People attending")).toBeVisible();
    await expect(page.getByText("Recommended intros")).toBeVisible();
    await expect(page.getByText("Your meetings")).toBeVisible();
  });

  test("See matches link navigates to matches page", async ({ page }) => {
    await page.goto(EVENT_URL);
    await page.getByRole("link", { name: /see matches/i }).click();
    await expect(page).toHaveURL(`${EVENT_URL}/matches`);
  });

  test("Scan QR link navigates to scan page", async ({ page }) => {
    await page.goto(EVENT_URL);
    // Target the hero button link by href — more reliable than accessible name
    await page.locator(`a[href="${EVENT_URL}/scan"]`).first().click();
    await expect(page).toHaveURL(`${EVENT_URL}/scan`);
  });
});

test.describe("matches page", () => {
  test("shows ranked recommendations list", async ({ page }) => {
    await page.goto(`${EVENT_URL}/matches`);
    await expect(page.getByRole("heading", { name: /recommended people/i })).toBeVisible();
    await expect(page.getByText(/ranked by goals/i)).toBeVisible();
    // At least one match card should be visible
    await expect(page.locator(".grid > *").first()).toBeVisible();
  });

  test("each match card shows a numeric score badge", async ({ page }) => {
    await page.goto(`${EVENT_URL}/matches`);
    // MatchCard renders the score as text inside a Badge; scores are 20-100
    const firstCard = page.locator(".grid > *").first();
    await expect(firstCard).toBeVisible();
    // The score value is a number rendered directly as text inside the badge
    await expect(firstCard.getByText(/^\d+$/).first()).toBeVisible();
  });
});

test.describe("scan page", () => {
  test("shows meeting log panel with attendee selector", async ({ page }) => {
    await page.goto(`${EVENT_URL}/scan`);
    await expect(page.getByRole("heading", { name: /scan/i })).toBeVisible();
    await expect(page.getByText(/log a meeting/i)).toBeVisible();
    await expect(page.locator("select")).toBeVisible();
    await expect(page.getByPlaceholder(/quick note/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /confirm meeting/i })).toBeVisible();
  });

  test("logs a meeting and shows confirmation status", async ({ page }) => {
    await page.goto(`${EVENT_URL}/scan`);

    // Wait for the select to be populated with attendee options
    const select = page.locator("select");
    await expect(select).toBeVisible();
    // The select already has a default value set — just add a note and confirm
    await page.getByPlaceholder(/quick note/i).fill("Great conversation about AI infrastructure.");
    await page.getByRole("button", { name: /confirm meeting/i }).click();

    await expect(page.getByText(/meeting logged|saved offline/i)).toBeVisible();
  });
});

test.describe("QR meet page", () => {
  test("shows confirm meeting panel for a specific attendee", async ({ page }) => {
    await page.goto("/meet/relo-summit-2026/att-2");
    await expect(page.getByRole("heading", { name: /confirm meeting/i })).toBeVisible();
    await expect(page.getByText(/log a meeting/i)).toBeVisible();
  });
});
