---
sidebar_position: 3
---

# Conversation API

Complete reference for the Conversation class.

## Conversation

The single source of truth for test session state.

### Constructor

```python
Conversation(events: Optional[List[Event]] = None, metadata: Optional[Dict[str, Any]] = None)
```

**Example:**

```python
conv = Conversation()

# With metadata
conv = Conversation([], {
    "test_id": "TC-001",
    "environment": "staging"
})
```

---

## Instance Methods

### with_event()

Add an event and return new conversation (immutable).

```python
def with_event(self, event: Event) -> Conversation:
```

**Example:**

```python
conv = Conversation()
conv = conv.with_event(BrowserActionEvent("click", "#button"))
```

---

### events

Get all events.

```python
@property
def events(self) -> List[Event]:
```

**Example:**

```python
all_events = conversation.events
```

---

### get_events_of_type()

Filter events by type.

```python
def get_events_of_type(self, event_type: Type[T]) -> List[T]:
```

**Example:**

```python
actions = conversation.get_events_of_type(BrowserActionEvent)
failures = conversation.get_events_of_type(TestFailureEvent)
```

---

### has_failures()

Check if conversation contains failures.

```python
def has_failures(self) -> bool:
```

**Example:**

```python
if conversation.has_failures():
    print("Test failed")
```

---

### get_failures()

Get all failure events.

```python
def get_failures(self) -> List[TestFailureEvent]:
```

---

### get_current_state()

Derive current state from events.

```python
def get_current_state(self) -> State:
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
