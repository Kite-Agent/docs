---
sidebar_position: 1
---

# Basic Test Example

A complete example of creating and running a basic test with KiteAgent.

## Scenario

Test a login flow:

1. Navigate to login page
2. Enter credentials
3. Submit form
4. Verify successful login

## Complete Code

```python
from kite_agent import (
    KiteAgent,
    BrowsingAgent,
    BrowserTool,
    Conversation
)
import os

def test_login():
    # Initialize agent
    agent = BrowsingAgent(
        llm={
            "model": "gpt-4",
            "api_key": os.getenv("OPENAI_API_KEY"),
            "temperature": 0.0
        },
        tools=[
            BrowserTool(
                headless=True,
                viewport={"width": 1920, "height": 1080}
            )
        ]
    )

    # Create conversation
    conversation = Conversation()

    try:
        # Step 1: Navigate
        conversation = agent.execute(
            conversation,
            "Navigate to https://example.com/login"
        )

        # Step 2: Enter username
        conversation = agent.execute(
            conversation,
            "Enter 'testuser@example.com' in the username field"
        )

        # Step 3: Enter password
        conversation = agent.execute(
            conversation,
            "Enter 'SecurePass123!' in the password field"
        )

        # Step 4: Submit
        conversation = agent.execute(
            conversation,
            "Click the 'Login' button"
        )

        # Step 5: Verify
        conversation = agent.execute(
            conversation,
            "Verify that the page URL is 'https://example.com/dashboard'"
        )

        conversation = agent.execute(
            conversation,
            "Verify that the text 'Welcome, testuser' is visible"
        )

        print("✓ Test passed!")

        # Save conversation for later analysis
        conversation.save("./conversations/login-test.json")
    except Exception as error:
        print(f"✗ Test failed: {error}")

        # Save failed conversation for debugging
        conversation.save("./conversations/login-test-failed.json")
        raise error

    return conversation

# Run test
if __name__ == "__main__":
    try:
        conv = test_login()
        print(f"Test completed with {len(conv.events)} events")
    except Exception as error:
        print(f"Test execution failed: {error}")
        exit(1)
```

## Generate Test Code

After running the test, generate Playwright code:

```python
from kite_agent import CodingAgent
import os

def generate_test_code(conversation: Conversation):
    coding_agent = CodingAgent(
        llm={
            "model": "gpt-4",
            "api_key": os.getenv("OPENAI_API_KEY")
        }
    )

    # Generate Playwright code
    code = coding_agent.generate_code(conversation, "playwright")

    # Save to file
    with open("./tests/login.spec.ts", "w") as f:
        f.write(code)

    print("Generated test code saved to ./tests/login.spec.ts")

# Usage
conversation = test_login()
generate_test_code(conversation)
```

## Generated Output

The Coding Agent will generate code like this:

```typescript
import { test, expect } from "@playwright/test";

test("User login flow", async ({ page }) => {
  // Navigate to login page
  await page.goto("https://example.com/login");

  // Enter credentials
  await page.fill('input[name="username"]', "testuser@example.com");
  await page.fill('input[name="password"]', "SecurePass123!");

  // Submit form
  await page.click('button:has-text("Login")');

  // Verify successful login
  await expect(page).toHaveURL("https://example.com/dashboard");
  await expect(page.locator("text=Welcome, testuser")).toBeVisible();
});
```

## Running the Generated Test

```bash
# Install Playwright
npm install -D @playwright/test

# Run the generated test
npx playwright test tests/login.spec.ts
```

## Next Steps

- **[Self-Healing Example](./self-healing)**: See automatic recovery in action
- **[Code Generation Example](./code-generation)**: Advanced code generation
- **[Guides](../guides/getting-started)**: Learn more about KiteAgent
