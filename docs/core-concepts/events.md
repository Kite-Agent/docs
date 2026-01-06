---
sidebar_position: 4
---

# Events

Immutable events (OpenHands pattern) extended for testing.

## Event Types

### TestRequestEvent

```python
TestRequestEvent(
    url='https://example.com',
    scenario='Login with valid credentials'
)
```

### BrowserActionEvent

```python
BrowserActionEvent(
    action='click',
    selector='#submit-button'
)

BrowserActionEvent(
    action='type',
    selector='input[name="username"]',
    data='testuser'
)
```

### DOMObservationEvent

```python
DOMObservationEvent(
    dom_tree='<button>Login</button>',  # Condensed
    screenshot_b64='data:image...',
    url='https://example.com/login'
)
```

### AssertionEvent

```python
AssertionEvent(
    expected='Dashboard',
    actual='Dashboard',
    passed=True
)
```

### TestFailureEvent

```python
TestFailureEvent(
    error_type='ElementNotFoundException',
    error_message='Selector not found: #old-button',
    healing_attempted=True
)
```

## Working with Events

### Reading Events

```python
# Get all actions
actions = [e for e in conversation.events
           if isinstance(e, BrowserActionEvent)]

# Get failures
failures = [e for e in conversation.events
            if isinstance(e, TestFailureEvent)]
```

### Event Patterns

**Action-Observation:**

```python
conversation = conversation.with_event(
    BrowserActionEvent('click', '#btn')
)
conversation = conversation.with_event(
    DOMObservationEvent(dom='...', screenshot='...')
)
```

## Next Steps

- **[Conversation](./conversation)** - Managing events
- **[Guides: Events](../guides/events)** - Practical usage
