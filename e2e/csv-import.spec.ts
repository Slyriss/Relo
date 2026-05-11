import path from "node:path";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { expect, test } from "./fixtures";

// CSV upload lives on the organizer dashboard event detail page
const EVENT_DASHBOARD_URL = "/dashboard/events/relo-summit-2026";

const VALID_CSV = `name,email,company,title,linkedin_url,bio
"Alice Grant",alice@example.com,"Acme Corp",Founder,https://linkedin.com/in/alice,"Raising Series A for climate tech startup"
"Bob Singh",bob@example.com,"TechCo",VP Engineering,https://linkedin.com/in/bob,"Scaling engineering teams for hypergrowth B2B SaaS"`;

test.describe("CSV import", () => {
  test("imports attendees from a valid CSV file", async ({ authedPage: page }) => {
    await page.goto(EVENT_DASHBOARD_URL);

    const csvPath = path.join(tmpdir(), "relo-test-attendees.csv");
    writeFileSync(csvPath, VALID_CSV);

    const fileInput = page.locator('input[type="file"][accept*="csv"]');
    await fileInput.setInputFiles(csvPath);

    await expect(page.getByText(/2 attendees imported/i)).toBeVisible();
  });

  test("reports error for CSV missing required columns", async ({ authedPage: page }) => {
    await page.goto(EVENT_DASHBOARD_URL);

    const csvPath = path.join(tmpdir(), "relo-bad.csv");
    writeFileSync(csvPath, "name,email\nAlice,alice@example.com");

    const fileInput = page.locator('input[type="file"][accept*="csv"]');
    await fileInput.setInputFiles(csvPath);

    await expect(page.getByText(/0 attendees imported|missing columns/i)).toBeVisible();
  });
});
