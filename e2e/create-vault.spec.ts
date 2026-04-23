import { test, expect } from "@playwright/test";
import { mockFileSystemAccess } from "./helpers";

test.describe("create new vault", () => {
  test("happy path: create, confirm key, land on entries page", async ({
    page,
  }) => {
    await mockFileSystemAccess(page);
    await page.goto("/");

    await page.getByRole("button", { name: /create a new one/i }).click();

    await expect(
      page.getByRole("heading", { name: /create a new vault/i }),
    ).toBeVisible();
    await page.getByPlaceholder("Decryption key…").fill("e2e-correct-horse");
    await page
      .getByPlaceholder("Confirm decryption key…")
      .fill("e2e-correct-horse");

    await page.getByRole("button", { name: /create vault/i }).click();

    await expect(page).toHaveURL(/\/entries$/);
  });

  test("mismatched keys show a validation error and stay on the form", async ({
    page,
  }) => {
    await mockFileSystemAccess(page);
    await page.goto("/");

    await page.getByRole("button", { name: /create a new one/i }).click();

    await page.getByPlaceholder("Decryption key…").fill("secret-one");
    await page.getByPlaceholder("Confirm decryption key…").fill("secret-two");
    await page.getByRole("button", { name: /create vault/i }).click();

    await expect(page.getByRole("alert")).toContainText(
      /do not match|don't match/i,
    );
    await expect(page).not.toHaveURL(/\/entries/);
  });
});
