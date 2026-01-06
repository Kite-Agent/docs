---
sidebar_position: 5
---

# Complex Workflows

Learn how to build sophisticated testing workflows with KiteAgent.

## Multi-Page Workflows

```typescript
async function testCheckoutWorkflow() {
  const agent = new BrowsingAgent({...});
  let conv = new Conversation();

  // Product selection
  conv = await agent.execute(conv, "Search for 'laptop'");
  conv = await agent.execute(conv, "Click first result");
  conv = await agent.execute(conv, "Click 'Add to Cart'");

  // Cart review
  conv = await agent.execute(conv, "Navigate to cart");
  conv = await agent.execute(conv, "Verify cart contains 1 item");

  // Checkout
  conv = await agent.execute(conv, "Click 'Checkout'");
  conv = await agent.execute(conv, "Fill shipping address");
  conv = await agent.execute(conv, "Select payment method");
  conv = await agent.execute(conv, "Click 'Place Order'");

  // Confirmation
  conv = await agent.execute(conv, "Verify order confirmation displayed");

  return conv;
}
```

## Conditional Logic

```typescript
async function testWithConditions(agent: BrowsingAgent) {
  let conv = new Conversation();

  conv = await agent.execute(conv, "Navigate to product page");

  // Check if item is in stock
  const stockCheck = await agent.execute(
    conv,
    "Check if 'In Stock' text is visible"
  );

  if (stockCheck.hasElement("text=In Stock")) {
    conv = await agent.execute(conv, "Click 'Add to Cart'");
  } else {
    conv = await agent.execute(conv, "Click 'Notify Me'");
  }

  return conv;
}
```

## Parallel Execution

```typescript
async function runParallelTests() {
  const agent = new BrowsingAgent({...});

  // Run multiple tests in parallel
  const results = await Promise.all([
    testLogin(agent),
    testRegistration(agent),
    testPasswordReset(agent)
  ]);

  return results;
}
```

## Data-Driven Testing

```typescript
const testData = [
  { username: "user1", password: "pass1", shouldSucceed: true },
  { username: "user2", password: "wrong", shouldSucceed: false },
  { username: "user3", password: "pass3", shouldSucceed: true },
];

for (const data of testData) {
  const conv = await agent.execute(
    new Conversation(),
    `Login with username "${data.username}" and password "${data.password}"`
  );

  const succeeded = !conv.hasFailures();
  console.assert(
    succeeded === data.shouldSucceed,
    `Test case failed for ${data.username}`
  );
}
```

## Next Steps

- **[Examples](../examples/basic-test)**: Real-world scenarios
- **[API Reference](../api/agents)**: Complete API docs
