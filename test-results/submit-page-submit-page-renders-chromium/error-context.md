# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: submit-page.spec.ts >> submit page renders
- Location: tests/e2e/submit-page.spec.ts:3:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3100/submit
Call log:
  - navigating to "http://127.0.0.1:3100/submit", waiting until "load"

```

# Test source

```ts
  1 | import { test, expect } from "@playwright/test";
  2 | 
  3 | test("submit page renders", async ({ page }) => {
> 4 |   await page.goto("/submit");
    |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3100/submit
  5 |   await expect(page.getByRole("heading", { name: "提交内容" })).toBeVisible();
  6 | });
  7 | 
```