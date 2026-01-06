---
sidebar_position: 3
---

# Working with Events

Learn how to work with KiteAgent's event system for advanced test scenarios.

## Event Basics

Every action in KiteAgent is recorded as an immutable event:

```typescript
import { BrowserActionEvent, DOMObservationEvent } from "@kite-agent/core";

// Create action event
const clickEvent = new BrowserActionEvent({
  action: "click",
  selector: "#submit-button",
  timestamp: new Date(),
});

// Create observation event
const observation = new DOMObservationEvent({
  dom_tree: '<button id="submit">Submit</button>',
  screenshot_b64: "data:image/png;base64,...",
  url: "https://example.com",
});
```

## Reading Events

### Filtering by Type

```typescript
// Get all actions
const actions = conversation.events.filter(
  (e) => e instanceof BrowserActionEvent
);

// Get all observations
const observations = conversation.events.filter(
  (e) => e instanceof DOMObservationEvent
);

// Get failures
const failures = conversation.events.filter(
  (e) => e instanceof TestFailureEvent
);
```

### Analyzing Event Sequences

```typescript
function analyzeConversation(conversation: Conversation) {
  console.log(`Total events: ${conversation.events.length}`);

  const actionCount = conversation.events.filter(
    (e) => e instanceof BrowserActionEvent
  ).length;

  const failureCount = conversation.events.filter(
    (e) => e instanceof TestFailureEvent
  ).length;

  console.log(`Actions: ${actionCount}`);
  console.log(`Failures: ${failureCount}`);
  console.log(
    `Success rate: ${(
      ((actionCount - failureCount) / actionCount) *
      100
    ).toFixed(1)}%`
  );
}
```

## Custom Events

Create domain-specific events:

```typescript
import { Event } from "@kite-agent/core";

class CheckoutCompletedEvent extends Event {
  constructor(
    public orderId: string,
    public total: number,
    public items: string[]
  ) {
    super();
  }
}

// Use in conversation
conversation = conversation.withEvent(
  new CheckoutCompletedEvent("ORDER-123", 99.99, ["Item 1", "Item 2"])
);
```

## Event Patterns

### Action-Observation Pattern

Always pair actions with observations:

```typescript
// Action
conversation = conversation.withEvent(
  new BrowserActionEvent({ action: "click", selector: "#btn" })
);

// Observation
conversation = conversation.withEvent(
  new DOMObservationEvent({ dom_tree: "...", screenshot_b64: "..." })
);
```

### Assertion Pattern

Add verification events:

```typescript
// Perform action
conversation = await agent.execute(conv, "Click login");

// Add assertion
conversation = conversation.withEvent(
  new AssertionEvent({
    expected: "Dashboard",
    actual: pageTitle,
    passed: pageTitle === "Dashboard",
  })
);
```

## Next Steps

- **[Tools Guide](./tools)**: Learn about tools
- **[Workflows](./workflows)**: Complex scenarios
- **[Core Concepts: Events](../core-concepts/events)**: Deep dive
