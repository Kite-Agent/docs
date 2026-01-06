---
sidebar_position: 1
---

# Getting Started

This guide will help you get up and running with KiteAgent quickly.

## Prerequisites

Before you begin, ensure you have:

- **Python** 3.9 or higher
- **pip** package manager

## Installation

```bash
pip install kite-agent
```

## Quick Start

### 1. Create Your First Test

Create a file `my_first_test.py`:

```python
from kite_agent import KiteAgent, BrowserTool, SelfHealingSkill
import os

def main():
    # Initialize agent
    agent = KiteAgent(
        llm={
            "model": "gpt-4",
            "api_key": os.getenv("OPENAI_API_KEY")
        },
        tools=[BrowserTool()],
        skills=[SelfHealingSkill()]
    )

    # Run test in natural language
    conversation = agent.test(
        url="https://example.com",
        scenario="Login with valid credentials and verify dashboard loads"
    )

    # Generate Playwright code
    code = agent.generate_code(conversation, framework="playwright")
    print("Generated test code:")
    print(code)

if __name__ == "__main__":
    main()
```

### 2. Run Your Test

```bash
python my_first_test.py
```

### 3. View Results

The agent will:

1. Navigate to the URL
2. Identify login form elements
3. Fill in credentials
4. Click submit button
5. Verify dashboard loads
6. Generate Playwright code

## Configuration

### Basic Configuration

```python
agent = KiteAgent(
    llm={
        "model": "gpt-4",
        "temperature": 0.0,  # Conservative (recommended for tests)
        "api_key": os.getenv("OPENAI_API_KEY")
    },
    browser={
        "headless": True,
        "viewport": {"width": 1920, "height": 1080}
    }
)
```

### Advanced Configuration

```python
agent = KiteAgent(
    llm={
        "model": "gpt-4",
        "temperature": 0.0,
        "api_key": os.getenv("OPENAI_API_KEY")
    },
    tools=[
        BrowserTool(
            headless=False,  # Show browser window
            slow_mo=100      # Slow down actions
        )
    ],
    skills=[
        SelfHealingSkill(
            vision_model="gpt-4-vision",
            max_retries=3
        ),
        VisualCheckSkill(
            threshold=0.95  # 95% similarity required
        )
    ],
    timeout=30000  # 30 second timeout
)
```

## Your First Real Test

Let's create a complete login test:

```python
from kite_agent import KiteAgent
import os

agent = KiteAgent(
    llm={"model": "gpt-4", "api_key": os.getenv("OPENAI_API_KEY")}
)

def test_login():
    conversation = agent.test(
        url="https://your-app.com/login",
        scenario="""
        1. Navigate to login page
        2. Enter username "testuser@example.com"
        3. Enter password "Test123!"
        4. Click login button
        5. Verify user is redirected to dashboard
        6. Verify username is displayed in header
        """
    )

    # Check for failures
    if conversation.has_failures():
        print("✗ Test failed!")
        for failure in conversation.get_failures():
            print(f"- {failure.error_message}")
        return

    print("✓ Test passed!")

    # Generate code for CI/CD
    playwright_code = agent.generate_code(conversation, framework="playwright")
    with open("./tests/login.spec.ts", "w") as f:
        f.write(playwright_code)

if __name__ == "__main__":
    test_login()
```

## Environment Variables

Create a `.env` file:

```bash
# LLM Configuration
OPENAI_API_KEY=sk-...
MODEL_NAME=gpt-4

# Browser Configuration
HEADLESS=true
VIEWPORT_WIDTH=1920
VIEWPORT_HEIGHT=1080

# Agent Configuration
MAX_RETRIES=3
TIMEOUT=30000
```

Load environment variables:

```python
from kite_agent import KiteAgent
from dotenv import load_dotenv
import os

load_dotenv()

agent = KiteAgent(
    llm={
        "model": os.getenv("MODEL_NAME"),
        "api_key": os.getenv("OPENAI_API_KEY")
    },
    browser={
        "headless": os.getenv("HEADLESS") == "true",
        "viewport": {
            "width": int(os.getenv("VIEWPORT_WIDTH")),
            "height": int(os.getenv("VIEWPORT_HEIGHT"))
        }
    }
)
```

## Debugging

### Enable Verbose Logging

```typescript
const agent = new KiteAgent({
  logging: {
    level: "debug",
    output: "console",
  },
});
```

### Save Conversations

```typescript
const conversation = await agent.test({...});

// Save for later analysis
await conversation.save('./conversations/test-session.json');

// Load and replay
const loaded = await Conversation.load('./conversations/test-session.json');
await agent.replay(loaded);
```

### Capture Screenshots

```typescript
const agent = new KiteAgent({
  browser: {
    screenshots: {
      onAction: true, // Screenshot after each action
      onFailure: true, // Screenshot on errors
      path: "./screenshots",
    },
  },
});
```

## Next Steps

Now that you have KiteAgent running:

- **[Agents Guide](./agents)**: Learn about different agent types
- **[Events Guide](./events)**: Understanding the event system
- **[Tools Guide](./tools)**: Extending capabilities
- **[Workflows](./workflows)**: Complex test scenarios
- **[Examples](../examples/basic-test)**: Real-world use cases

## Common Issues

### Issue: "OpenAI API key not found"

**Solution**: Set your API key in environment variables:

```bash
export OPENAI_API_KEY=sk-...
```

### Issue: "Browser not launching"

**Solution**: Install Playwright browsers:

```bash
npx playwright install chromium
```

### Issue: "Element not found" errors

**Solution**: Enable self-healing:

```typescript
const agent = new KiteAgent({
  skills: [new SelfHealingSkill()],
});
```

## Getting Help

- **Documentation**: Read the full documentation
- **GitHub Issues**: Report bugs or request features
- **Discord**: Join our community for support
- **Examples**: Check out example projects
