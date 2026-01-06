---
sidebar_position: 1
---

# Agents API

Complete API reference for KiteAgent agents.

## BrowsingAgent

The primary agent for browser-based testing.

### Constructor

```python
BrowsingAgent(config: BrowsingAgentConfig)
```

#### BrowsingAgentConfig

```python
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class BrowsingAgentConfig:
    llm: LLMConfig
    tools: List[Tool]
    skills: Optional[List[Skill]] = None
    timeout: Optional[int] = None
    logging: Optional[LoggingConfig] = None
```

### Methods

#### execute()

Execute a single test instruction.

```python
def execute(
    self,
    conversation: Conversation,
    instruction: str
) -> Conversation:
```

**Parameters:**

- `conversation`: Current conversation state
- `instruction`: Natural language instruction

**Returns:** Updated conversation with new events

**Example:**

```python
agent = BrowsingAgent(...)
conv = Conversation()
conv = agent.execute(conv, "Click login button")
```

---

## CodingAgent

Agent for generating test code from conversations.

### Constructor

```python
CodingAgent(config: CodingAgentConfig)
```

### Methods

#### generateCode()

Generate test code from conversation.

```python
def generate_code(
    self,
    conversation: Conversation,
    framework: Literal['playwright', 'selenium', 'cypress'],
    options: Optional[CodeGenOptions] = None
) -> str:
```

**Parameters:**

- `conversation`: Conversation to convert
- `framework`: Target test framework
- `options`: Code generation options

**Returns:** Generated test code as string

**Example:**

```python
agent = CodingAgent(...)
code = agent.generate_code(conv, 'playwright')
```

---

## SupervisorAgent

Coordinates multiple agents.

### Constructor

```python
SupervisorAgent(config: SupervisorConfig)
```

#### SupervisorConfig

```python
@dataclass
class SupervisorConfig:
    workers: dict  # {
        # "browsing": BrowsingAgent,
        # "api": APIAgent,  # Optional
        # "coding": CodingAgent
    # }
    llm: LLMConfig
```

### Methods

#### execute()

Execute complex multi-agent scenario.

```python
def execute(self, request: TestRequest) -> TestResult:
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
