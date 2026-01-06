---
sidebar_position: 2
---

# Working with Agents

This guide covers practical usage of KiteAgent's multi-agent system.

## Agent Overview

KiteAgent uses specialized agents for different testing tasks:

- **Supervisor Agent**: Coordinates test execution
- **Browsing Agent**: Executes browser interactions
- **Coding Agent**: Generates test code
- **Planner Agent**: Creates test strategies

## Basic Agent Usage

### Simple Test Execution

```python
from kite_agent import BrowsingAgent, BrowserTool, Conversation
import os

agent = BrowsingAgent(
    tools=[BrowserTool()],
    llm={"model": "gpt-4", "api_key": os.getenv("OPENAI_API_KEY")}
)

# Execute single instruction
conversation = agent.execute(
    Conversation(),
    "Click the login button"
)
```

### Multi-Step Tests

```python
agent = BrowsingAgent(
    tools=[BrowserTool()]
)

conversation = Conversation()

# Step 1: Navigate
conversation = agent.execute(
    conversation,
    "Navigate to https://example.com/login"
)

# Step 2: Fill form
conversation = agent.execute(
    conversation,
    "Enter 'testuser' in the username field"
)

conversation = agent.execute(
    conversation,
    "Enter 'password123' in the password field"
)

# Step 3: Submit
conversation = agent.execute(conversation, "Click the submit button")

# Step 4: Verify
conversation = agent.execute(
    conversation,
    "Verify the page shows 'Welcome, testuser'"
)
```

## Agent Configuration

### Conservative Agent (Production)

For critical flows, use conservative settings:

```python
production_agent = BrowsingAgent(
    llm={
        "model": "gpt-4",
        "temperature": 0.0,  # Deterministic
        "max_tokens": 2000
    },
    tools=[BrowserTool(headless=True)],
    skills=[SelfHealingSkill(max_retries=5)],
    timeout=60000  # 60 seconds
)
```

### Exploratory Agent (Development)

For exploration, use more flexible settings:

```python
exploratory_agent = BrowsingAgent(
    llm={
        "model": "gpt-3.5-turbo",
        "temperature": 0.7  # More creative
    },
    tools=[BrowserTool(headless=False, slow_mo=500)],
    timeout=30000
)
```

## Agent Orchestration

### Using Supervisor Agent

The Supervisor Agent coordinates multiple agents:

```python
from kite_agent import SupervisorAgent

supervisor = SupervisorAgent(
    workers={
        "browsing": BrowsingAgent(...),
        "api": APIAgent(...),
        "coding": CodingAgent(...)
    }
)

# Supervisor delegates automatically
result = supervisor.execute(
    scenario="""
        1. Test user registration via UI
        2. Verify user created via API
        3. Generate test code for both
    """
)
```

### Manual Agent Coordination

For custom workflows, coordinate agents manually:

```python
browsing_agent = BrowsingAgent(...)
coding_agent = CodingAgent(...)

# Step 1: Execute test
conversation = Conversation()
conversation = browsing_agent.execute(
    conversation,
    "Complete the checkout flow"
)

# Step 2: Generate code from execution
code = coding_agent.generate_code(
    conversation,
    framework="playwright"
)

print(code)
```

## Advanced Patterns

### Agent with Custom Tools

```python
from custom_tool import CustomTool

agent = BrowsingAgent(
    tools=[
        BrowserTool(),
        CustomTool()  # Your custom tool
    ]
)

# Agent automatically selects appropriate tool
agent.execute(conversation, "Send Slack notification")
```

### Agent with Multiple Skills

```python
agent = BrowsingAgent(
    skills=[
        SelfHealingSkill(),
        VisualCheckSkill(),
        AccessibilitySkill()
    ]
)

# Skills activate automatically when needed
```

### Custom Agent

Create specialized agents for your domain:

```python
class ECommerceAgent(BrowsingAgent):
    def add_to_cart(self, product: str):
        conv = self.conversation

        conv = self.execute(conv, f'Search for "{product}"')
        conv = self.execute(conv, "Click first result")
        conv = self.execute(conv, "Click 'Add to Cart'")

        return conv

    def checkout(self):
        conv = self.conversation

        conv = self.execute(conv, "Click cart icon")
        conv = self.execute(conv, "Click 'Proceed to Checkout'")
        conv = self.execute(conv, "Fill shipping information")
        conv = self.execute(conv, "Select payment method")

        return conv

# Usage
agent = ECommerceAgent(...)
conv = agent.add_to_cart("Laptop")
conv = agent.checkout()
```

## Error Handling

### Retry Logic

```python
import time

def execute_with_retry(
    agent: BrowsingAgent,
    conversation: Conversation,
    instruction: str,
    max_retries: int = 3
) -> Conversation:
    for i in range(max_retries):
        try:
            return agent.execute(conversation, instruction)
        except Exception as error:
            if i == max_retries - 1:
                raise error
            print(f"Retry {i + 1}/{max_retries}")
            time.sleep(1 * (i + 1))  # Exponential backoff
```

### Graceful Degradation

```python
try:
    conversation = agent.execute(conversation, "Click the submit button")
except Exception as error:
    print("Primary method failed, trying alternative")

    # Try alternative approach
    conversation = agent.execute(
        conversation,
        "Press Enter key to submit form"
    )
```

## Best Practices

### 1. Use Specific Instructions

```python
# ❌ Vague
agent.execute(conv, "Login")

# ✅ Specific
agent.execute(conv, "Enter 'admin' in username field")
agent.execute(conv, "Enter 'pass123' in password field")
agent.execute(conv, "Click button with text 'Login'")
```

### 2. Verify After Actions

```python
# Always verify important actions
conversation = agent.execute(conv, "Click 'Delete Account'")
conversation = agent.execute(
    conv,
    "Verify confirmation message is displayed"
)
```

### 3. Keep Conversations Focused

```python
# ✅ Good: One conversation per test scenario
login_conv = run_login_test()
checkout_conv = run_checkout_test()

# ❌ Bad: Everything in one conversation
mega_conv = run_all_tests()
```

## Next Steps

- **[Events Guide](./events)**: Learn about event handling
- **[Tools Guide](./tools)**: Create custom tools
- **[Workflows](./workflows)**: Complex testing scenarios
- **[API Reference](../api/agents)**: Complete agent API
