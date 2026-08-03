import { expect, test } from "@playwright/test";

const enrichmentResponse = {
  industry: "Aerospace",
  about: "Test company overview.",
  urgency: "Low",
  sentiment: "Positive",
  query: "Test query"
};

async function completeStageOne(page) {
  await page.getByRole("textbox", { name: "Email address" }).fill("test.user@example.com");
  await page.getByRole("textbox", { name: "First name" }).fill("Avery");
  await page.getByRole("textbox", { name: "Last name" }).fill("Jordan");
  await page.getByRole("textbox", { name: "Inquiry" }).fill("Regression test inquiry.");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("group", { name: "Personal details" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled({ timeout: 25000 });
}

async function completeStagesOneAndTwo(page) {
  await completeStageOne(page);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Final step" })).toBeVisible();
}

test("F1 prefills Country from FreeIPAPI", async ({ page }) => {
  await page.route("**free.freeipapi.com/api/json", (route) => route.fulfill({
    json: { countryCode: "GB" }
  }));
  await page.goto("/");

  await expect(page.locator("#country")).toHaveValue("GB");
  await expect(page.locator("#country-lookup-status")).toBeVisible();
});

test("F1 keeps a visitor's Country selection when its lookup finishes later", async ({ page }) => {
  let fulfillLookup;
  await page.route("**free.freeipapi.com/api/json", async (route) => {
    await new Promise((resolve) => {
      fulfillLookup = async () => {
        await route.fulfill({ json: { countryCode: "GB" } });
        resolve();
      };
    });
  });
  await page.goto("/");
  await expect.poll(() => Boolean(fulfillLookup)).toBe(true);

  await page.locator("#country").selectOption("DE");
  await fulfillLookup();

  await expect(page.locator("#country")).toHaveValue("DE");
  await expect(page.locator("#country-lookup-status")).not.toBeVisible();
});

test("requires first name, last name, and email on Stage 1", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#stage-one-guidance")).not.toBeVisible();
  await page.getByRole("textbox", { name: "First name" }).fill("");
  await page.getByRole("textbox", { name: "Last name" }).fill("");
  await page.getByRole("textbox", { name: "Email address" }).fill("test.user@example.com");
  await page.getByRole("button", { name: "Continue" }).press("Enter");

  await expect(page.getByText("Enter your first name, last name, and a valid email address.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "First name" })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("textbox", { name: "Last name" })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("group", { name: "Personal details" })).not.toBeVisible();
});

test("does not repeat completed stage fields on confirmation", async ({ page }) => {
  await page.goto("/");
  await completeStagesOneAndTwo(page);

  await expect(page.getByRole("textbox", { name: "First name" })).not.toBeVisible();
  await expect(page.getByRole("textbox", { name: "Last name" })).not.toBeVisible();
  await expect(page.getByRole("group", { name: "Personal details" })).not.toBeVisible();
  await expect(page.getByRole("group", { name: "Company details" })).not.toBeVisible();
  await expect(page.getByText("By submitting this form, your personal data will be processed")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Enriched details" })).toBeVisible();
  await expect(page.locator("#enriched-details")).not.toHaveAttribute("open", "");
  await expect(page.getByRole("textbox", { name: "About" })).not.toBeVisible();

  await page.locator("#enriched-details > summary").click();
  await expect(page.locator("#enriched-details")).toHaveAttribute("open", "");
  await expect(page.getByRole("textbox", { name: "About" })).toBeVisible();
});

test("allows edits from confirmation and confirms the prototype submission", async ({ page }) => {
  await page.goto("/");
  await completeStagesOneAndTwo(page);

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("group", { name: "Company details" })).toBeVisible();
  await page.getByRole("textbox", { name: "Company name" }).fill("Avery Labs");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "Submit Inquiry" }).click();
  await expect(page.getByText("Your inquiry has been recorded for this prototype. No information was sent.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit Inquiry" })).toBeDisabled();
});

test("makes Back 20% smaller than its former mobile action share", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await completeStagesOneAndTwo(page);

  const actionWidths = await page.locator(".form__actions").evaluate((actions) => {
    const backButton = actions.querySelector("#back-button");
    const continueButton = actions.querySelector("#verify-button");

    return {
      back: backButton.getBoundingClientRect().width,
      continue: continueButton.getBoundingClientRect().width
    };
  });

  expect(actionWidths.back / (actionWidths.back + actionWidths.continue)).toBeCloseTo(0.8 / 3, 2);
});

test("maps a successful enrichment response into Enriched details", async ({ page }) => {
  await page.route("**/enrich-company", (route) => route.fulfill({ json: enrichmentResponse }));
  await page.goto("/");
  await completeStageOne(page);
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.locator("#about")).toHaveValue(enrichmentResponse.about);
  await expect(page.locator("#urgency")).toHaveValue(enrichmentResponse.urgency);
  await expect(page.locator("#sentiment")).toHaveValue(enrichmentResponse.sentiment);
  await expect(page.locator("#query")).toHaveValue(enrichmentResponse.query);
  await expect(page.locator("#industry")).toHaveValue(enrichmentResponse.industry);
});

test("ignores a stale enrichment response after the company URL changes", async ({ page }) => {
  let fulfilRoute;
  await page.route("**/enrich-company", async (route) => {
    await new Promise((resolve) => {
      fulfilRoute = async () => {
        await route.fulfill({ json: enrichmentResponse });
        resolve();
      };
    });
  });
  await page.goto("/");
  await page.getByRole("textbox", { name: "Email address" }).fill("test.user@example.com");
  await page.getByRole("textbox", { name: "First name" }).fill("Avery");
  await page.getByRole("textbox", { name: "Last name" }).fill("Jordan");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("group", { name: "Personal details" })).toBeVisible();

  await expect.poll(() => Boolean(fulfilRoute)).toBe(true);
  await page.locator("#website").evaluate((field) => {
    field.value = "changed.example";
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await fulfilRoute();

  await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled({ timeout: 25000 });
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("#about")).toHaveValue("");
});

test("preserves newsletter consent after returning from confirmation", async ({ page }) => {
  await page.goto("/");
  await completeStageOne(page);

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("checkbox", { name: "Subscribe" })).toBeVisible();
  await page.getByRole("checkbox", { name: "Subscribe" }).check();

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("checkbox", { name: "Subscribe" })).not.toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("checkbox", { name: "Subscribe" })).toBeChecked();
});

test("moves keyboard focus to the current stage after navigation", async ({ page }) => {
  await page.goto("/");
  await completeStageOne(page);
  await expect(page.locator("#verified-fields")).toBeFocused();

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("textbox", { name: "First name" })).toBeFocused();

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("#verified-fields")).toBeFocused();

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Final step" })).toBeFocused();

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.locator("#verified-fields")).toBeFocused();
});

test("recovers after enrichment is unavailable", async ({ page }) => {
  await page.route("**/enrich-company", (route) => route.abort());
  await page.goto("/");
  await completeStageOne(page);

  await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled({ timeout: 25000 });
});

test("does not horizontally overflow at the configured viewport", async ({ page }) => {
  await page.goto("/");

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  );

  expect(hasHorizontalOverflow).toBe(false);
});
