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

```typescript
import { BrowsingAgent, BrowserTool } from "@kite-agent/core";

const agent = new BrowsingAgent({
  tools: [new BrowserTool()],
  llm: { model: "gpt-4", apiKey: process.env.OPENAI_API_KEY },
});

// Execute single instruction
const conversation = await agent.execute(
  new Conversation(),
  "Click the login button"
);
```

### Multi-Step Tests

```typescript
const agent = new BrowsingAgent({
  tools: [new BrowserTool()],
});

let conversation = new Conversation();

// Step 1: Navigate
conversation = await agent.execute(
  conversation,
  "Navigate to https://example.com/login"
);

// Step 2: Fill form
conversation = await agent.execute(
  conversation,
  "Enter 'testuser' in the username field"
);

conversation = await agent.execute(
  conversation,
  "Enter 'password123' in the password field"
);

// Step 3: Submit
conversation = await agent.execute(conversation, "Click the submit button");

// Step 4: Verify
conversation = await agent.execute(
  conversation,
  "Verify the page shows 'Welcome, testuser'"
);
```

## Agent Configuration

### Conservative Agent (Production)

For critical flows, use conservative settings:

```typescript
const productionAgent = new BrowsingAgent({
  llm: {
    model: "gpt-4",
    temperature: 0.0, // Deterministic
    maxTokens: 2000,
  },
  tools: [new BrowserTool({ headless: true })],
  skills: [new SelfHealingSkill({ maxRetries: 5 })],
  timeout: 60000, // 60 seconds
});
```

### Exploratory Agent (Development)

For exploration, use more flexible settings:

```typescript
const exploratoryAgent = new BrowsingAgent({
  llm: {
    model: "gpt-3.5-turbo",
    temperature: 0.7, // More creative
  },
  tools: [new BrowserTool({ headless: false, slowMo: 500 })],
  timeout: 30000,
});
```

## Agent Orchestration

### Using Supervisor Agent

The Supervisor Agent coordinates multiple agents:

```typescript
import { SupervisorAgent } from '@kite-agent/core';

const supervisor = new SupervisorAgent({
  workers: {
    browsing: new BrowsingAgent({...}),
    api: new APIAgent({...}),
    coding: new CodingAgent({...})
  }
});

// Supervisor delegates automatically
const result = await supervisor.execute({
  scenario: `
    1. Test user registration via UI
    2. Verify user created via API
    3. Generate test code for both
  `
});
```

### Manual Agent Coordination

For custom workflows, coordinate agents manually:

```typescript
const browsingAgent = new BrowsingAgent({...});
const codingAgent = new CodingAgent({...});

// Step 1: Execute test
let conversation = new Conversation();
conversation = await browsingAgent.execute(
  conversation,
  "Complete the checkout flow"
);

// Step 2: Generate code from execution
const code = await codingAgent.generateCode(
  conversation,
  'playwright'
);

console.log(code);
```

## Advanced Patterns

### Agent with Custom Tools

```typescript
import { CustomTool } from "./custom-tool";

const agent = new BrowsingAgent({
  tools: [
    new BrowserTool(),
    new CustomTool(), // Your custom tool
  ],
});

// Agent automatically selects appropriate tool
await agent.execute(conversation, "Send Slack notification");
```

### Agent with Multiple Skills

```typescript
const agent = new BrowsingAgent({
  skills: [
    new SelfHealingSkill(),
    new VisualCheckSkill(),
    new AccessibilitySkill(),
  ],
});

// Skills activate automatically when needed
```

### Custom Agent

Create specialized agents for your domain:

```typescript
class ECommerceAgent extends BrowsingAgent {
  async addToCart(product: string) {
    let conv = this.conversation;

    conv = await this.execute(conv, `Search for "${product}"`);
    conv = await this.execute(conv, "Click first result");
    conv = await this.execute(conv, "Click 'Add to Cart'");

    return conv;
  }

  async checkout() {
    let conv = this.conversation;

    conv = await this.execute(conv, "Click cart icon");
    conv = await this.execute(conv, "Click 'Proceed to Checkout'");
    conv = await this.execute(conv, "Fill shipping information");
    conv = await this.execute(conv, "Select payment method");

    return conv;
  }
}

// Usage
const agent = new ECommerceAgent({...});
let conv = await agent.addToCart("Laptop");
conv = await agent.checkout();
```

## Error Handling

### Retry Logic

```typescript
async function executeWithRetry(
  agent: BrowsingAgent,
  conversation: Conversation,
  instruction: string,
  maxRetries: number = 3
): Promise<Conversation> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await agent.execute(conversation, instruction);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries}`);
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

### Graceful Degradation

```typescript
try {
  conversation = await agent.execute(conversation, "Click the submit button");
} catch (error) {
  console.warn("Primary method failed, trying alternative");

  // Try alternative approach
  conversation = await agent.execute(
    conversation,
    "Press Enter key to submit form"
  );
}
```

## Best Practices

### 1. Use Specific Instructions

```typescript
// ❌ Vague
await agent.execute(conv, "Login");

// ✅ Specific
await agent.execute(conv, "Enter 'admin' in username field");
await agent.execute(conv, "Enter 'pass123' in password field");
await agent.execute(conv, "Click button with text 'Login'");
```

### 2. Verify After Actions

```typescript
// Always verify important actions
conversation = await agent.execute(conv, "Click 'Delete Account'");
conversation = await agent.execute(
  conv,
  "Verify confirmation message is displayed"
);
```

### 3. Keep Conversations Focused

```typescript
// ✅ Good: One conversation per test scenario
const loginConv = await runLoginTest();
const checkoutConv = await runCheckoutTest();

// ❌ Bad: Everything in one conversation
const megaConv = await runAllTests();
```

## Next Steps

- **[Events Guide](./events)**: Learn about event handling
- **[Tools Guide](./tools)**: Create custom tools
- **[Workflows](./workflows)**: Complex testing scenarios
- **[API Reference](../api/agents)**: Complete agent API
