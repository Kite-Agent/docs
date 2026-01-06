---
sidebar_position: 3
---

# Conversation API

Complete reference for the Conversation class.

## Conversation

The single source of truth for test session state.

### Constructor

```typescript
new Conversation(events?: Event[], metadata?: Record<string, any>)
```

**Example:**

```typescript
const conv = new Conversation();

// With metadata
const conv = new Conversation([], {
  testId: "TC-001",
  environment: "staging",
});
```

---

## Instance Methods

### withEvent()

Add an event and return new conversation (immutable).

```typescript
withEvent(event: Event): Conversation
```

**Example:**

```typescript
let conv = new Conversation();
conv = conv.withEvent(new BrowserActionEvent("click", "#button"));
```

---

### getEvents()

Get all events.

```typescript
get events(): Event[]
```

**Example:**

```typescript
const allEvents = conversation.events;
```

---

### getEventsOfType()

Filter events by type.

```typescript
getEventsOfType<T extends Event>(type: new (...args: any[]) => T): T[]
```

**Example:**

```typescript
const actions = conversation.getEventsOfType(BrowserActionEvent);
const failures = conversation.getEventsOfType(TestFailureEvent);
```

---

### hasFailures()

Check if conversation contains failures.

```typescript
hasFailures(): boolean
```

**Example:**

```typescript
if (conversation.hasFailures()) {
  console.error("Test failed");
}
```

---

### getFailures()

Get all failure events.

```typescript
getFailures(): TestFailureEvent[]
```

---

### getCurrentState()

Derive current state from events.

```typescript
getCurrentState(): State
```

**Returns:** Current state object with DOM, URL, screenshot, etc.

---

### replayUntilEvent()

Replay events until specific index.

```typescript
replayUntilEvent(index: number): State
```

**Parameters:**

- `index`: Event index to replay until

**Returns:** State at that point in history

---

### save()

Save conversation to file.

```typescript
async save(filepath: string): Promise<void>
```

**Example:**

```typescript
await conversation.save("./conversations/test-session.json");
```

---

### load()

Load conversation from file (static method).

```typescript
static async load(filepath: string): Promise<Conversation>
```

**Example:**

```typescript
const conv = await Conversation.load("./conversations/test-session.json");
```

---

## Properties

### events

```typescript
readonly events: Event[]
```

Array of all events in chronological order.

---

### metadata

```typescript
readonly metadata: Record<string, any>
```

Additional conversation metadata.

---

## State Object

The derived state from conversation:

```typescript
interface State {
  url: string;
  dom: string;
  screenshot?: string;
  timestamp: Date;
}
```

## Next Steps

- **[Events API](./events)**: Event types
- **[Agents API](./agents)**: Agent methods
- **[Core Concepts: Conversation](../core-concepts/conversation)**: Deep dive
