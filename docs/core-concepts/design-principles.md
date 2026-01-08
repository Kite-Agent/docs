---
sidebar_position: 2
---

# Design Principles

KiteAgent follows OpenHands design principles, extended for testing.

## From OpenHands

### 1. Event-Driven Architecture

Every action is an immutable Event in Conversation.

```python
from openhands.sdk.event import MessageEvent, ActionEvent, ObservationEvent

# All actions recorded as events
conversation.send_message("Test login")  # → MessageEvent
conversation.run()                        # → ActionEvent + ObservationEvent

# Complete audit trail
for event in conversation.state.events:
    print(f"\{event.timestamp\}: \{event.event_type\}")
```

**Why:** Complete test execution history for debugging and replay.

### 2. Stateless Logic

Agent doesn't hold state - all state lives in `Conversation`.

```python
# ✅ Correct (Stateless)
class BrowsingAgent:
    def step(self, conversation):
        # Read state from conversation
        events = conversation.state.events
        # Process and return new events
        return new_events

# ❌ Wrong (Stateful)
class BrowsingAgent:
    def __init__(self):
        self.test_state = \{\}  # Don't store state in agent!
```

**Why:** Enables replay, time-travel debugging, and parallel execution.

### 3. Action-Observation Pattern

Tools follow strict input-output contract.

```python
from openhands.sdk.tool import ToolDefinition

class BrowserUseTool(ToolDefinition):
    def create(self, conv_state, **params):
        # Factory returns executable tool
        return [browser_automation_instance]

# Usage
ActionEvent → Tool → ObservationEvent
```

**Why:** Type-safe, testable, and composable tool system.

## From LangGraph

### 4. Graph Orchestration

Multi-agent coordination via StateGraph.

```python
from langgraph.graph import StateGraph

workflow = StateGraph(KiteGraphState)
workflow.add_node("browsing_agent", browsing_subgraph)
workflow.add_node("coding_agent", coding_subgraph)
workflow.add_conditional_edges("supervisor", route_to_worker)

graph = workflow.compile(checkpointer=checkpointer)
```

**Why:** Flexible workflows, conditional routing, parallel execution.

### 5. Persistent Memory

Checkpointer stores conversation threads.

```python
from langgraph.checkpoint.postgres import PostgresSaver

checkpointer = PostgresSaver.from_conn_string("postgresql://localhost/kite")
graph = workflow.compile(checkpointer=checkpointer)

# Resume later with thread_id
result = graph.invoke(messages, config=\{"configurable": \{"thread_id": "test-123"\}\})
```

**Why:** Resume tests, debug failures, audit trails.

### 6. Subgraph Workers

Each agent runs independently as subgraph node.

```python
def browsing_subgraph(state: KiteGraphState):
    # Create isolated conversation
    with LocalWorkspace() as workspace:
        conversation = Conversation(agent=browsing_agent, workspace=workspace)
        conversation.send_message(state["messages"][-1]["content"])
        conversation.run()
        
        return \{"browsing_result": extract_results(conversation)\}
```

**Why:** Isolation, independent scaling, fault tolerance.

## From browser-use

### 7. Direct Integration

browser-use registered as OpenHands tool, not wrapped.

```python
from browser_use import Tools

def create_browser_tool(conv_state, **params):
    tools = Tools()  # All 20+ browser-use actions available
    
    # Custom actions via native API
    @tools.action(description='Extract test data')
    def extract_test_data(prompt: str, browser_session):
        page = await browser_session.must_get_current_page()
        return await page.extract_content(prompt, llm=conv_state.agent.llm)
    
    return [BrowserUseTool(tools=tools)]

register_tool("BrowserAutomation", create_browser_tool)
```

**Why:** Zero maintenance, up-to-date features, native extensibility.

## KiteAgent Testing Extensions

### 8. Testing-Specific Events

Track test execution with specialized events.

```python
class BrowserTestAction(ActionEvent):
    tool: Literal["browser_automation"]
    task: str
    params: dict[str, Any]
    
class BrowserTestObservation(ObservationEvent):
    success: bool
    result: str
    history: list[dict]
    screenshots: list[str]
    errors: list[str] | None
```

**Why:** Detailed test reporting, failure analysis, visual evidence.

### 9. Testing Skills

Self-healing, visual regression, test generation.

```python
self_healing_skill = Skill(
    name="self_healing",
    trigger=KeywordTrigger(keywords=["ElementNotFoundException", "selector failed"]),
    content="""
    When selector fails:
    1. Take screenshot
    2. Find similar elements via browser-use extract
    3. Generate new selector (prefer test IDs > aria > CSS)
    4. Log change to Conversation
    5. Continue test
    """
)
```

**Why:** Robust tests, automatic maintenance, failure recovery.

### 10. Test Workspace

Structured artifact storage.

```
/workspace/kite-tests/
├── artifacts/           # Screenshots, videos, HAR, traces
├── test-data/           # Fixtures, mock data
├── generated/           # Generated test code
└── reports/             # Test reports
```

**Why:** Organized test evidence, debugging support, compliance.

## Comparison: Generic vs Testing

| Principle | Generic Automation | Testing (KiteAgent) |
|-----------|-------------------|---------------------|
| **Events** | Code changes | Test steps + assertions + failures |
| **Tools** | File, bash | browser-use (20+ actions) + API clients |
| **Skills** | Coding standards | Self-healing + visual regression |
| **Workspace** | Code repo | Test artifacts (screenshots, videos) |
| **Memory** | Conversation only | Conversation + LangGraph checkpointer |
| **Output** | Code files | Test code + execution reports |

## Anti-Patterns

### ❌ Storing State in Agent

```python
# DON'T DO THIS
class BrowsingAgent:
    def __init__(self):
        self.current_page = None  # State in agent
        self.test_results = []
```

### ❌ Modifying Events

```python
# DON'T DO THIS
event.content = "modified"  # Events are immutable
```

### ❌ Wrapping browser-use

```python
# DON'T DO THIS - adds maintenance burden
class CustomBrowserWrapper:
    def __init__(self):
        self.browser_agent = BrowserUseAgent(...)
    
    def custom_click(self, selector):
        # Duplicating browser-use functionality
        pass
```

### ✅ Best Practices

```python
# DO THIS - Use standard APIs
register_tool("BrowserAutomation", create_browser_tool)

# DO THIS - Extend via Skills
agent = Agent(tools=[Tool(name="BrowserAutomation")], skills=[self_healing_skill])

# DO THIS - Read from Conversation
state = conversation.state
events = [e for e in state.events if isinstance(e, ObservationEvent)]
```

## Next Steps

- [Architecture](/docs/core-concepts/architecture) - System design
- [Agents](/docs/core-concepts/agents) - Agent implementation
- [Tools](/docs/core-concepts/tools-and-skills) - Tool system
- [Examples](/docs/examples/basic-test) - Practical examples
