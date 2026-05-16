import { expect, test } from "./fixtures";

test.describe("dashboard - events list", () => {
  test("shows seeded event and summary stats", async ({ authedPage: page }) => {
    await page.goto("/dashboard/events");
    await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
    await expect(page.getByText("Attendees", { exact: true })).toBeVisible();
    await expect(page.getByText("Meetings", { exact: true })).toBeVisible();
    await expect(page.getByText("Relo Summit 2026")).toBeVisible();
  });

  test("New event button navigates to create form", async ({ authedPage: page }) => {
    await page.goto("/dashboard/events");
    await page.locator('a[href="/dashboard/events/new"]').click();
    await expect(page).toHaveURL(/\/dashboard\/events\/new/);
    await expect(page.getByRole("heading", { name: /create event/i })).toBeVisible();
  });
});

test.describe("dashboard - create event", () => {
  test("fills and submits event form, redirects to new event", async ({ authedPage: page }) => {
    const title = `Test Conference ${Date.now()}`;
    await page.goto("/dashboard/events/new");

    await page.getByLabel("Event title").fill(title);
    await page.getByLabel("Description").fill("A great test event for networking.");
    await page.getByLabel("Venue").fill("Test Venue, London");
    const inputs = page.locator('input[type="datetime-local"]');
    await inputs.nth(0).fill("2026-09-01T09:00");
    await inputs.nth(1).fill("2026-09-01T18:00");

    await page.getByRole("button", { name: /create event/i }).click();

    await expect(page).toHaveURL(/\/dashboard\/events\/(?!new$)[^/]+$/);
  });

  test("newly created event appears in events list via sidebar nav", async ({ authedPage: page }) => {
    const title = `Playwright Summit ${Date.now()}`;
    await page.goto("/dashboard/events/new");
    await page.getByLabel("Event title").fill(title);
    await page.getByLabel("Description").fill("E2E testing meetup.");
    await page.getByLabel("Venue").fill("Online");
    const inputs = page.locator('input[type="datetime-local"]');
    await inputs.nth(0).fill("2026-10-01T10:00");
    await inputs.nth(1).fill("2026-10-01T17:00");
    await page.getByRole("button", { name: /create event/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/events\/(?!new$)[^/]+$/);

    // Use the sidebar link (client-side nav preserves Zustand state)
    await page.getByRole("link", { name: "Event control" }).click();
    await expect(page.getByRole("heading", { name: title, level: 3 })).toBeVisible();
  });
});
