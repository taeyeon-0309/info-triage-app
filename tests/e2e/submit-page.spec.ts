import { test, expect } from "@playwright/test";

test("submit page renders", async ({ page }) => {
  await page.goto("/submit");
  await expect(page.getByRole("heading", { name: "提交内容" })).toBeVisible();
});
