---
sidebar_position: 3
---

# Agents

Testing-specialized agents built on OpenHands foundation.

## BrowsingAgent

Executes browser tests using Browser-use.

```python
from kiteagent import BrowsingAgent, BrowserTool

agent = BrowsingAgent(
    tools=[BrowserTool()],
    llm={'model': 'gpt-4'}
)

# Execute test step
conversation = agent.execute(
    conversation,
    "Click the login button"
)
```

**Capabilities:**

- Browser interaction (via Browser-use)
- DOM observation
- Screenshot capture
- Self-healing

## CodingAgent

Generates test code from conversations.

```python
from kiteagent import CodingAgent

agent = CodingAgent(llm={'model': 'gpt-4'})

# Generate Playwright code
code = agent.generate_code(conversation, 'playwright')

# Generate Selenium code
code = agent.generate_code(conversation, 'selenium')
```

## SupervisorAgent

Coordinates multiple agents (via LangGraph).

```python
from kiteagent import SupervisorAgent

supervisor = SupervisorAgent(
    workers={
        'browsing': BrowsingAgent(...),
        'coding': CodingAgent(...)
    }
)

# Supervisor handles delegation
result = supervisor.execute({
    'scenario': 'Test checkout flow and generate code'
})
```

## PlannerAgent

Creates test execution plans.

```python
planner = PlannerAgent(llm={'model': 'gpt-4'})

plan = planner.create_plan(
    "Test user registration with edge cases"
)
# Returns: TestPlan with steps, data, assertions
```

## Agent Configuration

```python
# Conservative (production)
agent = BrowsingAgent(
    llm={'model': 'gpt-4', 'temperature': 0.0},
    timeout=60000,
    max_retries=5
)

# Fast (development)
agent = BrowsingAgent(
    llm={'model': 'gpt-3.5-turbo', 'temperature': 0.7},
    timeout=10000
)
```

## Next Steps

- **[Events](./events)** - Event system
- **[Conversation](./conversation)** - State management
- **[Guides: Agents](../guides/agents)** - Practical usage
