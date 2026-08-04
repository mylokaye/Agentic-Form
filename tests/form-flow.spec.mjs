import { expect, test } from "@playwright/test";

// F7 fixture — Complete five-string enrichment contract returned by both adapters.
const enrichmentResponse = {
  industry: "Aerospace",
  about: "Test company overview.",
  urgency: "Low",
  sentiment: "Positive",
  query: "Test query"
};

// F4, F6 helper — Satisfy Stage 1 validation and advance to Stage 2.
async function completeStageOne(page) {
  await page.getByRole("textbox", { name: "Email address" }).fill("test.user@example.com");
  await page.getByRole("textbox", { name: "First name" }).fill("Avery");
  await page.getByRole("textbox", { name: "Last name" }).fill("Jordan");
  await page.getByRole("textbox", { name: "Inquiry" }).fill("Regression test inquiry.");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("group", { name: "Personal details" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled({ timeout: 25000 });
}

// F4, F6 helper — Satisfy both progression gates and advance to Stage 3.
async function completeStagesOneAndTwo(page) {
  await completeStageOne(page);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("checkbox", { name: "Subscribe" })).toBeVisible();
}

test("[F3] prefills Language from the browser locale", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "language", {
      configurable: true,
      value: "de-DE"
    });
  });
  await page.goto("/");

  await expect(page.locator("#language")).toHaveValue("German");
});

test("[F10] personalizes the Newsletter banner from First name", async ({ page }) => {
  await page.route("**free.freeipapi.com/api/json", (route) => route.abort());
  await page.goto("/");
  await page.getByRole("textbox", { name: "First name" }).fill("Avery");

  const newsletterHeading = page.locator("#newsletter-heading");

  await expect(newsletterHeading).toHaveText("Content tailored for you, Avery.");
  await expect(newsletterHeading).toHaveCSS("font-size", "19px");
  await expect(newsletterHeading).toHaveCSS("color", "rgb(35, 13, 57)");
  await expect(newsletterHeading).toHaveCSS("font-family", /Inter/);
});

test("[F9] shows the full current form URL in the Debug accordion", async ({ page }) => {
  await page.route("**free.freeipapi.com/api/json", (route) => route.abort());
  await page.route("**/enrich-company", (route) => route.fulfill({ json: enrichmentResponse }));
  await page.goto("/?source=regression#inquiry");
  await completeStagesOneAndTwo(page);
  await page.locator("#enriched-details").evaluate((details) => {
    details.open = true;
  });

  await expect(page.getByLabel("Current URL")).toBeVisible();
  await expect(page.locator("#current-url")).not.toBeEditable();
  await expect(page.locator("#current-url")).toHaveValue(page.url());
});

test("[F5] derives empty Website and Company name fields from the Email domain", async ({ page }) => {
  await page.route("**free.freeipapi.com/api/json", (route) => route.abort());
  await page.route("**/enrich-company", (route) => route.fulfill({ json: enrichmentResponse }));
  await page.goto("/");

  await page.getByRole("textbox", { name: "Email address" }).fill("person@example-company.com");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.locator("#website")).toHaveValue("https://example-company.com");
  await expect(page.locator("#company-name")).toHaveValue("Example Company");

  await page.locator("#company-name").fill("Visitor Company");
  await expect(page.locator("#back-button")).toBeEnabled();
  await page.locator("#back-button").click();
  await page.getByRole("textbox", { name: "Email address" }).fill("person@updated-example.org");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.locator("#website")).toHaveValue("https://updated-example.org");
  await expect(page.locator("#company-name")).toHaveValue("Visitor Company");
});

test("[F1] prefills Country from FreeIPAPI", async ({ page }) => {
  await page.route("**free.freeipapi.com/api/json", (route) => route.fulfill({
    json: { countryCode: "GB", phoneCodes: [44] }
  }));
  await page.goto("/");

  await expect(page.locator("#country")).toHaveValue("GB");
  await expect(page.locator("#phone")).toHaveValue("+44 ");
  await expect(page.locator("#state")).not.toBeVisible();
  await expect(page.locator(".company-state-field")).toHaveCSS("display", "none");
});

test("[F2] lists Country options alphabetically", async ({ page }) => {
  await page.route("**free.freeipapi.com/api/json", (route) => route.abort());
  await page.goto("/");

  const countryNames = await page.locator("#country option").evaluateAll((options) =>
    options.slice(1).map((option) => option.textContent)
  );

  expect(countryNames).toEqual([...countryNames].sort((first, second) => first.localeCompare(second, "en")));
});

test("[F2] shows State only when United States is selected", async ({ page }) => {
  await page.route("**free.freeipapi.com/api/json", (route) => route.abort());
  await page.route("**/enrich-company", (route) => route.fulfill({ json: enrichmentResponse }));
  await page.goto("/");
  await completeStageOne(page);

  await expect(page.locator("#state")).not.toBeVisible();
  await expect(page.locator("#state")).toBeDisabled();
  await page.locator("#country").selectOption("US");
  await expect(page.locator("#state")).toBeVisible();
  await expect(page.locator("#state")).toBeEnabled();
  await page.locator("#country").selectOption("DE");
  await expect(page.locator("#state")).not.toBeVisible();
  await expect(page.locator("#state")).toBeDisabled();
  await expect(page.locator(".company-state-field")).toHaveCSS("display", "none");
});

test("[F6] keeps Stage 2 actions 45px below the final visible field", async ({ page }) => {
  await page.route("**free.freeipapi.com/api/json", (route) => route.abort());
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/");
  await completeStageOne(page);

  const actionGap = await page.locator("#country").evaluate((country) => {
    const actions = document.querySelector(".form__actions");
    const countryBottom = country.getBoundingClientRect().bottom;

    return actions.getBoundingClientRect().top - countryBottom;
  });

  expect(actionGap).toBeCloseTo(45, 0);
});

test("[F1] leaves Country empty when FreeIPAPI is unavailable", async ({ page }) => {
  await page.route("**free.freeipapi.com/api/json", (route) => route.abort());
  await page.goto("/");

  await expect(page.locator("#country")).toHaveValue("");
  await expect(page.locator("#phone")).toHaveValue("");
});

test("[F1] does not replace a Phone number entered before lookup completes", async ({ page }) => {
  let fulfillLookup;
  await page.route("**free.freeipapi.com/api/json", async (route) => {
    await new Promise((resolve) => {
      fulfillLookup = async () => {
        await route.fulfill({ json: { countryCode: "GB", phoneCodes: [44] } });
        resolve();
      };
    });
  });
  await page.goto("/");
  await expect.poll(() => Boolean(fulfillLookup)).toBe(true);

  await page.locator("#phone").evaluate((field) => {
    field.value = "+49 30 123456";
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await fulfillLookup();

  await expect(page.locator("#country")).toHaveValue("GB");
  await expect(page.locator("#phone")).toHaveValue("+49 30 123456");
});

test("[F1] keeps a visitor's Country selection when its lookup finishes later", async ({ page }) => {
  let fulfillLookup;
  await page.route("**free.freeipapi.com/api/json", async (route) => {
    await new Promise((resolve) => {
      fulfillLookup = async () => {
        await route.fulfill({ json: { countryCode: "GB" } });
        resolve();
      };
    });
  });
  await page.route("**/enrich-company", (route) => route.fulfill({ json: enrichmentResponse }));
  await page.goto("/");
  await expect.poll(() => Boolean(fulfillLookup)).toBe(true);
  await completeStageOne(page);

  await page.locator("#country").selectOption("DE");
  await fulfillLookup();

  await expect(page.locator("#country")).toHaveValue("DE");
});

test("[F4] requires first name, last name, and email on Stage 1", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#stage-one-guidance")).not.toBeVisible();
  await page.getByRole("textbox", { name: "First name" }).fill("");
  await page.getByRole("textbox", { name: "Last name" }).fill("");
  await page.getByRole("textbox", { name: "Email address" }).fill("test.user@example.com");
  await page.getByRole("button", { name: "Continue" }).press("Enter");

  await expect(page.locator("#form-message")).toHaveClass(/form__message--empty/);
  await expect(page.getByRole("textbox", { name: "First name" })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("textbox", { name: "Last name" })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByRole("textbox", { name: "First name" })).toHaveClass(/is-invalid/);
  await expect(page.getByRole("textbox", { name: "Last name" })).toHaveClass(/is-invalid/);
  await page.getByRole("textbox", { name: "Last name" }).fill("Jordan");
  await page.getByRole("textbox", { name: "Last name" }).press("Tab");
  await expect(page.getByRole("textbox", { name: "Last name" })).not.toHaveClass(/is-invalid/);
  await expect(page.getByRole("textbox", { name: "Last name" })).toHaveAttribute("aria-invalid", "false");
  await expect(page.getByRole("group", { name: "Personal details" })).not.toBeVisible();
});

test("[F4] uses a red Email validation edge without a Stage 1 banner", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "First name" }).fill("Avery");
  await page.getByRole("textbox", { name: "Last name" }).fill("Jordan");
  await page.getByRole("textbox", { name: "Email address" }).fill("not-an-email");
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("textbox", { name: "Email address" })).toHaveClass(/is-invalid/);
  await expect(page.getByRole("textbox", { name: "Email address" })).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#form-message")).toHaveClass(/form__message--empty/);
});

test("keeps the Inquiry label readable when textarea content scrolls", async ({ page }) => {
  await page.goto("/");
  await page.locator("#message").fill("One\nTwo\nThree\nFour\nFive\nSix");

  const labelStyle = await page.locator("label[for='message']").evaluate((label) => ({
    backgroundColor: getComputedStyle(label).backgroundColor,
    zIndex: getComputedStyle(label).zIndex
  }));

  expect(labelStyle.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(labelStyle.zIndex).toBe("1");
});

test("[F6] does not repeat completed stage fields on confirmation", async ({ page }) => {
  await page.goto("/");
  await completeStagesOneAndTwo(page);

  await expect(page.getByRole("textbox", { name: "First name" })).not.toBeVisible();
  await expect(page.getByRole("textbox", { name: "Last name" })).not.toBeVisible();
  await expect(page.getByRole("group", { name: "Personal details" })).not.toBeVisible();
  await expect(page.getByRole("group", { name: "Company details" })).not.toBeVisible();
  await expect(page.getByText("By submitting this form, your personal data will be processed")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Debug" })).toBeVisible();
  await expect(page.locator("#enriched-details")).not.toHaveAttribute("open", "");
  await expect(page.getByRole("textbox", { name: "About" })).not.toBeVisible();

  await page.locator("#enriched-details > summary").click();
  await expect(page.locator("#enriched-details")).toHaveAttribute("open", "");
  await expect(page.getByRole("textbox", { name: "About" })).toBeVisible();
});

test("[F6, F8] allows edits from confirmation and confirms the prototype submission", async ({ page }) => {
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

test("[F6] makes Back 20% smaller than its former mobile action share", async ({ page }) => {
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

test("[F7] maps a successful enrichment response into the Debug accordion", async ({ page }) => {
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

test("[F7] ignores a stale enrichment response after the company URL changes", async ({ page }) => {
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

test("[F6] preserves newsletter consent after returning from confirmation", async ({ page }) => {
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

test("[F6] moves keyboard focus to the current stage after navigation", async ({ page }) => {
  await page.goto("/");
  await completeStageOne(page);
  await expect(page.locator("#verified-fields")).toBeFocused();

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("textbox", { name: "First name" })).toBeFocused();

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("#verified-fields")).toBeFocused();

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("checkbox", { name: "Subscribe" })).toBeFocused();

  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.locator("#verified-fields")).toBeFocused();
});

test("[F7] recovers after enrichment is unavailable", async ({ page }) => {
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
