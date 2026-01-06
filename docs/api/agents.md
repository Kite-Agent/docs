---
sidebar_position: 1
---

# Agents API

Complete API reference for KiteAgent agents.

## BrowsingAgent

The primary agent for browser-based testing.

### Constructor

```typescript
new BrowsingAgent(config: BrowsingAgentConfig)
```

#### BrowsingAgentConfig

```typescript
interface BrowsingAgentConfig {
  llm: LLMConfig;
  tools: Tool[];
  skills?: Skill[];
  timeout?: number;
  logging?: LoggingConfig;
}
```

### Methods

#### execute()

Execute a single test instruction.

```typescript
async execute(
  conversation: Conversation,
  instruction: string
): Promise<Conversation>
```

**Parameters:**

- `conversation`: Current conversation state
- `instruction`: Natural language instruction

**Returns:** Updated conversation with new events

**Example:**

```typescript
const agent = new BrowsingAgent({...});
let conv = new Conversation();
conv = await agent.execute(conv, "Click login button");
```

---

## CodingAgent

Agent for generating test code from conversations.

### Constructor

```typescript
new CodingAgent(config: CodingAgentConfig)
```

### Methods

#### generateCode()

Generate test code from conversation.

```typescript
async generateCode(
  conversation: Conversation,
  framework: 'playwright' | 'selenium' | 'cypress',
  options?: CodeGenOptions
): Promise<string>
```

**Parameters:**

- `conversation`: Conversation to convert
- `framework`: Target test framework
- `options`: Code generation options

**Returns:** Generated test code as string

**Example:**

```typescript
const agent = new CodingAgent({...});
const code = await agent.generateCode(conv, 'playwright');
```

---

## SupervisorAgent

Coordinates multiple agents.

### Constructor

```typescript
new SupervisorAgent(config: SupervisorConfig)
```

#### SupervisorConfig

```typescript
interface SupervisorConfig {
  workers: {
    browsing: BrowsingAgent;
    api?: APIAgent;
    coding: CodingAgent;
  };
  llm: LLMConfig;
}
```

### Methods

#### execute()

Execute complex multi-agent scenario.

```typescript
async execute(request: TestRequest): Promise<TestResult>
```

---

## PlannerAgent

Creates test execution plans.

### Constructor

```typescript
new PlannerAgent(config: PlannerConfig)
```

### Methods

#### createPlan()

Generate test plan from requirements.

```typescript
async createPlan(requirement: string): Promise<TestPlan>
```

**Parameters:**

- `requirement`: Natural language test requirement

**Returns:** Structured test plan

**Example:**

```typescript
const planner = new PlannerAgent({...});
const plan = await planner.createPlan("Test checkout flow");
```

## Common Types

### LLMConfig

```typescript
interface LLMConfig {
  model: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}
```

### LoggingConfig

```typescript
interface LoggingConfig {
  level: "debug" | "info" | "warn" | "error";
  output: "console" | "file";
  filePath?: string;
}
```

## Next Steps

- **[Events API](./events)**: Event type reference
- **[Conversation API](./conversation)**: Conversation methods
- **[Tools API](./tools)**: Tool interface
