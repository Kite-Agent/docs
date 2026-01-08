---
sidebar_position: 3
---

# Working with Events

Learn how to work with KiteAgent's event system for advanced test scenarios.

## Event Basics

Every action in KiteAgent is recorded as an immutable event:

```python
from kite_agent import BrowserActionEvent, DOMObservationEvent
from datetime import datetime

# Create action event
click_event = BrowserActionEvent(
    action="click",
    selector="#submit-button",
    timestamp=datetime.now()
)

# Create observation event
observation = DOMObservationEvent(
    dom_tree='<button id="submit">Submit</button>',
    screenshot_b64="data:image/png;base64,...",
    url="https://example.com"
)
```

## Reading Events

### Filtering by Type

```python
# Get all actions
actions = [e for e in conversation.events if isinstance(e, BrowserActionEvent)]

# Get all observations
observations = [e for e in conversation.events if isinstance(e, DOMObservationEvent)]

# Get failures
failures = [e for e in conversation.events if isinstance(e, TestFailureEvent)]
```

### Analyzing Event Sequences

```python
def analyze_conversation(conversation: Conversation):
    print(f"Total events: \{len(conversation.events)\}")

    action_count = len([
        e for e in conversation.events
        if isinstance(e, BrowserActionEvent)
    ])

    failure_count = len([
        e for e in conversation.events
        if isinstance(e, TestFailureEvent)
    ])

    print(f"Actions: \{action_count\}")
    print(f"Failures: \{failure_count\}")

    success_rate = ((action_count - failure_count) / action_count) * 100
    print(f"Success rate: \{success_rate:.1f\}%")
```

## Custom Events

Create domain-specific events:

```python
from kite_agent import Event
from typing import List

class CheckoutCompletedEvent(Event):
    def __init__(self, order_id: str, total: float, items: List[str]):
        super().__init__()
        self.order_id = order_id
        self.total = total
        self.items = items

# Use in conversation
conversation = conversation.with_event(
    CheckoutCompletedEvent("ORDER-123", 99.99, ["Item 1", "Item 2"])
)
```

## Event Patterns

### Action-Observation Pattern

Always pair actions with observations:

```python
# Action
conversation = conversation.with_event(
    BrowserActionEvent(action="click", selector="#btn")
)

# Observation
conversation = conversation.with_event(
    DOMObservationEvent(dom_tree="...", screenshot_b64="...")
)
```

### Assertion Pattern

Add verification events:

```python
# Perform action
conversation = agent.execute(conv, "Click login")

# Add assertion
conversation = conversation.with_event(
    AssertionEvent(
        expected="Dashboard",
        actual=page_title,
        passed=(page_title == "Dashboard")
    )
)
```

## Next Steps

- **[Tools Guide](/docs/guides/tools)**: Learn about tools
- **[Workflows](/docs/guides/workflows)**: Complex scenarios
- **[Core Concepts: Events](/docs/core-concepts/events)**: Deep dive
