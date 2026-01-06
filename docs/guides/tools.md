---
sidebar_position: 4
---

# Creating Custom Tools

Extend KiteAgent with custom tools for your specific needs.

## Tool Interface

All tools implement the `Tool` interface:

```typescript
interface Tool {
  name: string;
  execute(action: Action): Promise<Event>;
  canHandle(action: Action): boolean;
}
```

## Basic Custom Tool

```typescript
import { Tool, Action, Event } from "@kite-agent/core";

class EmailTool implements Tool {
  name = "email";

  constructor(private config: EmailConfig) {}

  async execute(action: Action): Promise<Event> {
    if (action.type === "send") {
      return await this.sendEmail(action.data);
    }
    throw new Error(`Unknown action: ${action.type}`);
  }

  canHandle(action: Action): boolean {
    return action.toolName === "email";
  }

  private async sendEmail(data: any): Promise<EmailSentEvent> {
    // Implementation
    return new EmailSentEvent({
      to: data.to,
      subject: data.subject,
      success: true,
    });
  }
}

// Usage
const agent = new BrowsingAgent({
  tools: [new BrowserTool(), new EmailTool({ smtp: "smtp.example.com" })],
});
```

## Advanced Tool Example

```typescript
class DatabaseTool implements Tool {
  name = "database";

  constructor(private connection: DatabaseConnection) {}

  async execute(action: Action): Promise<Event> {
    switch (action.type) {
      case "query":
        return await this.query(action.data.sql);
      case "insert":
        return await this.insert(action.data.table, action.data.values);
      case "delete":
        return await this.delete(action.data.table, action.data.where);
      default:
        throw new Error(`Unknown action: ${action.type}`);
    }
  }

  canHandle(action: Action): boolean {
    return action.toolName === "database";
  }

  private async query(sql: string): Promise<QueryResultEvent> {
    const results = await this.connection.query(sql);
    return new QueryResultEvent({
      sql,
      rows: results.rows,
      rowCount: results.rowCount,
    });
  }
}
```

## Best Practices

1. **Single Responsibility**: One tool, one external system
2. **Error Handling**: Always wrap operations in try/catch
3. **Event Creation**: Return appropriate events for all outcomes
4. **Type Safety**: Use TypeScript for better developer experience

## Next Steps

- **[Core Concepts: Tools](../core-concepts/tools-and-skills)**: Deep dive
- **[Examples](../examples/basic-test)**: See tools in action
