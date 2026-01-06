---
sidebar_position: 2
---

# Events API

Complete reference for all event types in KiteAgent.

## Base Event

All events extend the base `Event` class:

```typescript
abstract class Event {
  timestamp: Date;
  id: string;
}
```

## TestRequestEvent

User's initial test request.

```typescript
class TestRequestEvent extends Event {
  constructor(
    public url: string,
    public scenario: string,
    public requirements?: string
  );
}
```

**Example:**

```typescript
const event = new TestRequestEvent(
  "https://example.com",
  "Test login flow",
  "Use admin credentials"
);
```

---

## BrowserActionEvent

Represents a browser interaction.

```typescript
class BrowserActionEvent extends Event {
  constructor(
    public action: string,
    public selector?: string,
    public data?: string,
    public url?: string,
    public result: ActionResult = ActionResult.SUCCESS
  );
}
```

**Properties:**

- `action`: Action type ('click', 'type', 'navigate', etc.)
- `selector`: Element selector (for click, type, etc.)
- `data`: Data for action (text to type, etc.)
- `url`: URL for navigate action
- `result`: Action result status

**Example:**

```typescript
const clickEvent = new BrowserActionEvent("click", "#submit-button");

const typeEvent = new BrowserActionEvent(
  "type",
  'input[name="username"]',
  "testuser"
);
```

---

## DOMObservationEvent

Browser state observation.

```typescript
class DOMObservationEvent extends Event {
  constructor(
    public dom_tree: string,
    public screenshot_b64?: string,
    public url: string = "",
    public viewport: [number, number] = [1920, 1080]
  );
}
```

**Properties:**

- `dom_tree`: Condensed DOM HTML
- `screenshot_b64`: Base64-encoded screenshot
- `url`: Current page URL
- `viewport`: Viewport dimensions

---

## AssertionEvent

Test assertion/verification.

```typescript
class AssertionEvent extends Event {
  constructor(
    public assertion_type: string,
    public expected: string,
    public actual: string,
    public passed: boolean,
    public message?: string
  );
}
```

**Assertion Types:**

- `equals`: Exact match
- `contains`: Partial match
- `visible`: Element visibility
- `count`: Element count

**Example:**

```typescript
const assertion = new AssertionEvent(
  "equals",
  "Dashboard",
  "Dashboard",
  true,
  "Page title matches"
);
```

---

## TestFailureEvent

Error or failure information.

```typescript
class TestFailureEvent extends Event {
  constructor(
    public error_type: string,
    public error_message: string,
    public traceback: string,
    public healing_attempted: boolean = false,
    public healing_successful: boolean = false
  );
}
```

**Error Types:**

- `ElementNotFoundException`
- `TimeoutException`
- `AssertionFailedException`
- `NetworkException`

---

## ActionResult

Enum for action results:

```typescript
enum ActionResult {
  SUCCESS = "success",
  FAILURE = "failure",
  TIMEOUT = "timeout",
}
```

## Next Steps

- **[Conversation API](./conversation)**: Working with conversations
- **[Agents API](./agents)**: Agent methods
- **[Guides: Events](../guides/events)**: Practical examples
