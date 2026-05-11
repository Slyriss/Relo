import { expect, test } from "./fixtures";

test.describe("dashboard - events list", () => {
  test("shows demo event and summary stats", async ({ authedPage: page }) => {
    await page.goto("/dashboard/events");
    await expect(page.getByRole("heading", { name: "Events" })).toBeVisible();
    // StatCard labels
    await expect(page.getByText("Attendees")).toBeVisible();
    await expect(page.getByText("Meetings")).toBeVisible();
    // Demo event card
    await expect(page.getByText("Relo Summit 2026")).toBeVisible();
  });

  test("New event button navigates to create form", async ({ authedPage: page }) => {
    await page.goto("/dashboard/events");
    await page.getByRole("link", { name: /new event/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/events\/new/);
    await expect(page.getByRole("heading", { name: /create event/i })).toBeVisible();
  });
});

test.describe("dashboard - create event", () => {
  test("fills and submits event form, redirects to new event", async ({ authedPage: page }) => {
    await page.goto("/dashboard/events/new");

    await page.getByPlaceholder("Event title").fill("Test Conference 2026");
    await page.getByPlaceholder("What makes this event valuable?").fill("A great test event for networking.");
    await page.getByPlaceholder("Venue").fill("Test Venue, London");
    const inputs = page.locator('input[type="datetime-local"]');
    await inputs.nth(0).fill("2026-09-01T09:00");
    await inputs.nth(1).fill("2026-09-01T18:00");

    await page.getByRole("button", { name: /create event/i }).click();

    await expect(page).toHaveURL(/\/dashboard\/events\/test-conference-2026/);
  });

  test("newly created event appears in events list via sidebar nav", async ({ authedPage: page }) => {
    await page.goto("/dashboard/events/new");
    await page.getByPlaceholder("Event title").fill("Playwright Summit");
    await page.getByPlaceholder("What makes this event valuable?").fill("E2E testing meetup.");
    await page.getByPlaceholder("Venue").fill("Online");
    const inputs = page.locator('input[type="datetime-local"]');
    await inputs.nth(0).fill("2026-10-01T10:00");
    await inputs.nth(1).fill("2026-10-01T17:00");
    await page.getByRole("button", { name: /create event/i }).click();

    // Use the sidebar link (client-side nav preserves Zustand state)
    await page.locator('a[href="/dashboard/events"]').click();
    await expect(page.getByText("Playwright Summit")).toBeVisible();
  });
});
