---
sidebar_position: 2
---

# Events API

Complete reference for all event types in KiteAgent.

## Base Event

All events extend the base `Event` class:

```python
from abc import ABC
from datetime import datetime
from dataclasses import dataclass

@dataclass
class Event(ABC):
    timestamp: datetime
    id: str
```

## TestRequestEvent

User's initial test request.

```python
@dataclass
class TestRequestEvent(Event):
    url: str
    scenario: str
    requirements: Optional[str] = None
```

**Example:**

```python
event = TestRequestEvent(
    url="https://example.com",
    scenario="Test login flow",
    requirements="Use admin credentials"
)
```

---

## BrowserActionEvent

Represents a browser interaction.

```python
from enum import Enum

class ActionResult(Enum):
    SUCCESS = "success"
    FAILURE = "failure"

@dataclass
class BrowserActionEvent(Event):
    action: str
    selector: Optional[str] = None
    data: Optional[str] = None
    url: Optional[str] = None
    result: ActionResult = ActionResult.SUCCESS
```

**Properties:**

- `action`: Action type ('click', 'type', 'navigate', etc.)
- `selector`: Element selector (for click, type, etc.)
- `data`: Data for action (text to type, etc.)
- `url`: URL for navigate action
- `result`: Action result status

**Example:**

```python
click_event = BrowserActionEvent(action="click", selector="#submit-button")

type_event = BrowserActionEvent(
    action="type",
    selector='input[name="username"]',
    data="testuser"
)
```

---

## DOMObservationEvent

Browser state observation.

```python
@dataclass
class DOMObservationEvent(Event):
    dom_tree: str
    screenshot_b64: Optional[str] = None
    url: str = ""
    viewport: tuple[int, int] = (1920, 1080)
```

**Properties:**

- `dom_tree`: Condensed DOM HTML
- `screenshot_b64`: Base64-encoded screenshot
- `url`: Current page URL
- `viewport`: Viewport dimensions

---

## AssertionEvent

Test assertion/verification.

```python
@dataclass
class AssertionEvent(Event):
    assertion_type: str
    expected: str
    actual: str
    passed: bool
    message: Optional[str] = None
```

**Assertion Types:**

- `equals`: Exact match
- `contains`: Partial match
- `visible`: Element visibility
- `count`: Element count

**Example:**

```python
assertion = AssertionEvent(
    assertion_type="equals",
    expected="Dashboard",
    actual="Dashboard",
    passed=True,
    message="Page title matches"
)
```

---

## TestFailureEvent

Error or failure information.

```python
@dataclass
class TestFailureEvent(Event):
    error_type: str
    error_message: str
    traceback: str
    healing_attempted: bool = False
    healing_successful: bool = False
```

**Error Types:**

- `ElementNotFoundException`
- `TimeoutException`
- `AssertionFailedException`
- `NetworkException`

---

## ActionResult

Enum for action results:

```python
from enum import Enum

class ActionResult(Enum):
    SUCCESS = "success"
    FAILURE = "failure"
    TIMEOUT = "timeout"
```

## Next Steps

- **[Conversation API](./conversation)**: Working with conversations
- **[Agents API](./agents)**: Agent methods
- **[Guides: Events](../guides/events)**: Practical examples
