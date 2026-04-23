import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import {
  disableFileSystemAccess,
  getCapturedVaultBytes,
  mockFileSystemAccess,
} from "./helpers";

const PASSPHRASE = "e2e-import-roundtrip";

async function createVaultBytes(page: Page) {
  await mockFileSystemAccess(page);
  await page.goto("/");
  await page.getByRole("button", { name: /create a new one/i }).click();
  await page.getByPlaceholder("Decryption key…").fill(PASSPHRASE);
  await page.getByPlaceholder("Confirm decryption key…").fill(PASSPHRASE);
  await page.getByRole("button", { name: /create vault/i }).click();
  await expect(page).toHaveURL(/\/entries$/);
  return getCapturedVaultBytes(page);
}

test.describe("import vault (file input fallback)", () => {
  test("round-trip: correct key unlocks the imported vault", async ({
    browser,
  }) => {
    const authorContext = await browser.newContext();
    const authorPage = await authorContext.newPage();
    const bytes = await createVaultBytes(authorPage);
    await authorContext.close();

    const importContext = await browser.newContext();
    const page = await importContext.newPage();
    await disableFileSystemAccess(page);
    await page.goto("/");

    await page.getByRole("button", { name: /import vault/i }).click();

    await expect(
      page.getByRole("heading", { name: /import vault/i }),
    ).toBeVisible();
    await page.locator('input[type="file"]').setInputFiles({
      name: "legacylink-vault.json",
      mimeType: "application/json",
      buffer: Buffer.from(bytes),
    });

    await expect(
      page.getByRole("heading", { name: /decryption key/i }),
    ).toBeVisible();
    await page.getByPlaceholder("Decryption key…").fill(PASSPHRASE);
    await page.getByRole("button", { name: /open vault/i }).click();

    await expect(page).toHaveURL(/\/entries$/);
    await importContext.close();
  });

  test("wrong key keeps the user on the unlock form with an error", async ({
    browser,
  }) => {
    const authorContext = await browser.newContext();
    const authorPage = await authorContext.newPage();
    const bytes = await createVaultBytes(authorPage);
    await authorContext.close();

    const importContext = await browser.newContext();
    const page = await importContext.newPage();
    await disableFileSystemAccess(page);
    await page.goto("/");

    await page.getByRole("button", { name: /import vault/i }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "legacylink-vault.json",
      mimeType: "application/json",
      buffer: Buffer.from(bytes),
    });
    await page.getByPlaceholder("Decryption key…").fill("wrong-key");
    await page.getByRole("button", { name: /open vault/i }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).not.toHaveURL(/\/entries/);
    await importContext.close();
  });
});
