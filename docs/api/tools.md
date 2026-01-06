---
sidebar_position: 4
---

# Tools API

Complete reference for tool interfaces and implementations.

## Tool Interface

Base interface for all tools.

```typescript
interface Tool {
  name: string;
  execute(action: Action): Promise<Event>;
  canHandle(action: Action): boolean;
}
```

---

## BrowserTool

Tool for browser automation.

### Constructor

```typescript
new BrowserTool(config?: BrowserToolConfig)
```

#### BrowserToolConfig

```typescript
interface BrowserToolConfig {
  headless?: boolean;
  viewport?: { width: number; height: number };
  slowMo?: number;
  timeout?: number;
}
```

### Methods

#### click()

Click an element.

```typescript
async click(selector: string): Promise<BrowserActionEvent>
```

#### type()

Enter text.

```typescript
async type(selector: string, text: string): Promise<BrowserActionEvent>
```

#### navigate()

Go to URL.

```typescript
async navigate(url: string): Promise<BrowserActionEvent>
```

#### extractContent()

Get element text.

```typescript
async extractContent(selector: string): Promise<string>
```

---

## APITool (Future)

Tool for API testing.

### Constructor

```typescript
new APITool(config?: APIToolConfig)
```

### Methods

#### get()

Send GET request.

```typescript
async get(url: string, headers?: Record<string, string>): Promise<APIResponseEvent>
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
