import { expect, test } from "@playwright/test";

test("preserves edited names through the three-step form flow", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("textbox", { name: "Email address" }).fill("test.user@example.com");
  await page.getByRole("textbox", { name: "First name" }).fill("Avery");
  await page.getByRole("textbox", { name: "Last name" }).fill("Jordan");
  await page.getByRole("textbox", { name: "Inquiry" }).fill("Regression test inquiry.");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("group", { name: "Personal details" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled({ timeout: 25000 });
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("heading", { name: "Confirm your inquiry" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "First name" })).toHaveValue("Avery");
  await expect(page.getByRole("textbox", { name: "Last name" })).toHaveValue("Jordan");
  await expect(page.getByText(/Article 6\(1\)\(a\) of the GDPR/)).toBeVisible();
});

test("does not horizontally overflow at the configured viewport", async ({ page }) => {
  await page.goto("/");

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );

  expect(hasHorizontalOverflow).toBe(false);
});
