import { test, expect } from "@playwright/test";

test.describe("unlock page", () => {
  test("shows import and create choices on first load", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "LegacyLink" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /import vault/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /create a new one/i }),
    ).toBeVisible();
  });

  test("protected routes redirect to the unlock page when locked", async ({
    page,
  }) => {
    await page.goto("/entries");

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("button", { name: /import vault/i }),
    ).toBeVisible();
  });

  test("unknown routes fall back to the unlock page", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("button", { name: /create a new one/i }),
    ).toBeVisible();
  });
});
