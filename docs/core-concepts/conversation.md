---
sidebar_position: 5
---

# Conversation

OpenHands' single source of truth for test sessions.

## Basic Usage

```python
from kiteagent import Conversation

# Create
conversation = Conversation()

# Add events (immutable)
conversation = conversation.with_event(event1)
conversation = conversation.with_event(event2)

# Access events
all_events = conversation.events
last_event = conversation.events[-1]

# Derive state
state = conversation.get_current_state()
```

## Time-Travel Debugging

```python
# Replay to specific point
state_at_step_5 = conversation.replay_until(5)

# Debug at failure
if conversation.has_failures():
    failure_index = conversation.get_failure_index()
    state = conversation.replay_until(failure_index)
    print(state.dom)  # Exact DOM at failure
    print(state.screenshot)  # Exact screenshot
```

## Persistence

```python
# Save
conversation.save('./sessions/test-123.json')

# Load
conversation = Conversation.load('./sessions/test-123.json')

# Replay
for event in conversation.events:
    print(f"{event.timestamp}: {event}")
```

## Metadata

```python
conversation = Conversation(metadata={
    'test_id': 'TC-001',
    'environment': 'staging',
    'created_by': 'automation'
})
```

## Next Steps

- **[Tools & Skills](./tools-and-skills)** - Extend capabilities
- **[API: Conversation](../api/conversation)** - Complete API
