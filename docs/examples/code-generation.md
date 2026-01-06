---
sidebar_position: 3
---

# Code Generation Example

Learn how to convert test sessions into production-ready code.

## Scenario

Record a manual test session and generate Playwright, Selenium, or Cypress code.

## Recording a Session

```typescript
import { BrowsingAgent, CodingAgent } from "@kite-agent/core";

async function recordAndGenerate() {
  // Step 1: Record test execution
  const browsingAgent = new BrowsingAgent({
    tools: [new BrowserTool()],
  });

  let conversation = new Conversation();

  conversation = await browsingAgent.execute(
    conversation,
    "Navigate to https://example.com"
  );

  conversation = await browsingAgent.execute(conversation, "Click 'Sign Up'");

  conversation = await browsingAgent.execute(
    conversation,
    "Fill registration form"
  );

  // Step 2: Generate code from conversation
  const codingAgent = new CodingAgent({
    llm: { model: "gpt-4", apiKey: process.env.OPENAI_API_KEY },
  });

  // Generate for different frameworks
  const playwrightCode = await codingAgent.generateCode(
    conversation,
    "playwright"
  );

  const seleniumCode = await codingAgent.generateCode(conversation, "selenium");

  const cypressCode = await codingAgent.generateCode(conversation, "cypress");

  // Save generated code
  await writeFile("./tests/signup.playwright.ts", playwrightCode);
  await writeFile("./tests/signup.selenium.py", seleniumCode);
  await writeFile("./tests/signup.cypress.js", cypressCode);
}
```

## Generated Code Examples

### Playwright Output

```typescript
import { test, expect } from "@playwright/test";

test("User signup flow", async ({ page }) => {
  await page.goto("https://example.com");
  await page.click("text=Sign Up");

  await page.fill('input[name="email"]', "user@example.com");
  await page.fill('input[name="password"]', "SecurePass123!");
  await page.click('button:has-text("Create Account")');

  await expect(page.locator("text=Welcome")).toBeVisible();
});
```

### Selenium Output

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def test_signup():
    driver = webdriver.Chrome()

    driver.get('https://example.com')
    driver.find_element(By.LINK_TEXT, 'Sign Up').click()

    driver.find_element(By.NAME, 'email').send_keys('user@example.com')
    driver.find_element(By.NAME, 'password').send_keys('SecurePass123!')
    driver.find_element(By.XPATH, '//button[text()="Create Account"]').click()

    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, '//*[text()="Welcome"]'))
    )

    driver.quit()
```

## Customizing Code Generation

```typescript
const code = await codingAgent.generateCode(conversation, "playwright", {
  // Add TypeScript types
  useTypeScript: true,

  // Include comments
  includeComments: true,

  // Add explicit waits
  explicitWaits: true,

  // Generate Page Object Model
  usePageObjects: true,
});
```

## Next Steps

- **[Basic Test Example](./basic-test)**: Start with basics
- **[Guides: Code Generation](../guides/workflows)**: Advanced patterns
