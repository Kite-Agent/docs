---
sidebar_position: 4
---

# Creating Custom Tools

Extend KiteAgent with custom tools for your specific needs.

## Tool Interface

All tools implement the `Tool` protocol:

```python
from typing import Protocol
from kite_agent import Action, Event

class Tool(Protocol):
    name: str

    def execute(self, action: Action) -> Event:
        ...

    def can_handle(self, action: Action) -> bool:
        ...
```

## Basic Custom Tool

```python
from kite_agent import Tool, Action, Event
from typing import Dict, Any

class EmailTool(Tool):
    def __init__(self, config: Dict[str, Any]):
        self.name = "email"
        self.config = config

    def execute(self, action: Action) -> Event:
        if action.type == "send":
            return self._send_email(action.data)
        raise ValueError(f"Unknown action: {action.type}")

    def can_handle(self, action: Action) -> bool:
        return action.tool_name == "email"

    def _send_email(self, data: Dict[str, Any]) -> "EmailSentEvent":
        # Implementation
        return EmailSentEvent(
            to=data["to"],
            subject=data["subject"],
            success=True
        )

# Usage
agent = BrowsingAgent(
    tools=[BrowserTool(), EmailTool({"smtp": "smtp.example.com"})]
)
```

## Advanced Tool Example

```python
class DatabaseTool(Tool):
    def __init__(self, connection: "DatabaseConnection"):
        self.name = "database"
        self.connection = connection

    def execute(self, action: Action) -> Event:
        if action.type == "query":
            return self._query(action.data["sql"])
        elif action.type == "insert":
            return self._insert(action.data["table"], action.data["values"])
        elif action.type == "delete":
            return self._delete(action.data["table"], action.data["where"])
        else:
            raise ValueError(f"Unknown action: {action.type}")

    def can_handle(self, action: Action) -> bool:
        return action.tool_name == "database"

    def _query(self, sql: str) -> "QueryResultEvent":
        results = self.connection.query(sql)
        return QueryResultEvent(
            sql=sql,
            rows=results.rows,
            row_count=results.row_count
        )
```

## Best Practices

1. **Single Responsibility**: One tool, one external system
2. **Error Handling**: Always wrap operations in try/catch
3. **Event Creation**: Return appropriate events for all outcomes
4. **Type Safety**: Use TypeScript for better developer experience

## Next Steps

- **[Core Concepts: Tools](../core-concepts/tools-and-skills)**: Deep dive
- **[Examples](../examples/basic-test)**: See tools in action
