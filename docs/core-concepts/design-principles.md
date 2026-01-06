---
sidebar_position: 2
---

# Design Principles

KiteAgent follows OpenHands design principles, extended for testing.

## 1. Stateless Agents

Agents don't store state - all state lives in `Conversation`.

```python
# ✅ Stateless (OpenHands way)
class Agent:
    def execute(self, conversation, action):
        state = conversation.get_current_state()
        result = self.do_work(state)
        return conversation.with_event(result)

# ❌ Stateful (anti-pattern)
class Agent:
    def __init__(self):
        self.state = {}  # Don't do this!
```

**Why:** Enables replay, debugging, and parallel execution.

## 2. One Source of Truth

`Conversation` is the only state storage.

```python
# All state derived from events
conversation = Conversation()
conversation = conversation.with_event(action1)
conversation = conversation.with_event(action2)

# Replay to any point
state_at_step_1 = conversation.replay_until(1)
```

**Why:** Perfect bug reproduction and time-travel debugging.

## 3. Event-Driven & Immutable

All actions are immutable events.

```python
@dataclass(frozen=True)  # Immutable
class BrowserActionEvent:
    action: str
    selector: str
    timestamp: datetime
```

**Why:** Complete audit trail, no race conditions.

## 4. Extensible via Tools

Add capabilities without changing core.

```python
# Add new tool
class SlackTool(Tool):
    def execute(self, action):
        # Send notification
        pass

agent = BrowsingAgent(tools=[
    BrowserTool(),
    SlackTool()  # Just add it
])
```

**Why:** Core stays stable, capabilities grow horizontally.

## Testing-Specific Extensions

### DOM Condensing

```python
# Reduce LLM token usage
raw_dom = page.get_html()  # 50,000 tokens
condensed = condenser.condense(raw_dom)  # 5,000 tokens
```

### Self-Healing

```python
try:
    click('#old-selector')
except ElementNotFound:
    # Automatically find new selector
    new_selector = self_healing.recover()
    click(new_selector)
```

### Test Artifacts

```python
# Conversation includes
- Action history
- Screenshots
- DOM snapshots
- Video recording
- Generated code
```

## Next Steps

- **[Agents](./agents)** - Agent implementations
- **[Events](./events)** - Event types
- **[Conversation](./conversation)** - State management
