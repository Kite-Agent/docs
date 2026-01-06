---
sidebar_position: 4
---

# Tools API

Complete reference for tool interfaces and implementations.

## Tool Interface

Base interface for all tools.

```python
from typing import Protocol

class Tool(Protocol):
    name: str
    
    def execute(self, action: Action) -> Event:
        ...
    
    def can_handle(self, action: Action) -> bool:
        ...
```

---

## BrowserTool

Tool for browser automation.

### Constructor

```python
BrowserTool(config: Optional[BrowserToolConfig] = None)
```

#### BrowserToolConfig

```python
@dataclass
class BrowserToolConfig:
    headless: bool = True
    viewport: dict = field(default_factory=lambda: {"width": 1920, "height": 1080})
    slow_mo: int = 0
    timeout: int = 30000
```

### Methods

#### click()

Click an element.

```python
def click(self, selector: str) -> BrowserActionEvent:
```

#### type()

Enter text.

```python
def type(self, selector: str, text: str) -> BrowserActionEvent:
```

#### navigate()

Go to URL.

```python
def navigate(self, url: str) -> BrowserActionEvent:
```

#### extract_content()

Get element text.

```python
def extract_content(self, selector: str) -> str:
```

---

## APITool (Future)

Tool for API testing.

### Constructor

```python
APITool(config: Optional[APIToolConfig] = None)
```

### Methods

#### get()

Send GET request.

```python
def get(self, url: str, headers: Optional[Dict[str, str]] = None) -> APIResponseEvent:
```

#### post()

Send POST request.

```typescript
async post(url: string, data: any, headers?: Record<string, string>): Promise<APIResponseEvent>
```

---

## Action Type

Action passed to tool.execute():

```typescript
interface Action {
  toolName: string;
  type: string;
  selector?: string;
  data?: any;
  url?: string;
}
```

## Next Steps

- **[Skills API](./skills)**: Skill interface reference
- **[Agents API](./agents)**: Using tools with agents
- **[Guides: Tools](../guides/tools)**: Creating custom tools
