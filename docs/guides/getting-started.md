---
sidebar_position: 1
---

# Getting Started

This guide helps you create your first test with KiteAgent.

## Installation

```bash
pip install kite-agent
```

## Prerequisites

- **Python** 3.9+
- **LLM API Key** (Anthropic Claude, OpenAI, etc.)
- **PostgreSQL** (optional, for session persistence)

## Quick Start

### 1. Single Agent Test

```python
from openhands.sdk import Agent, Conversation, LLM
from openhands.sdk.workspace import LocalWorkspace
from openhands.sdk.tool import Tool
from kite_agent.tools import register_browser_tool
from kite_agent.skills import self_healing_skill

# Register browser-use tool
register_browser_tool()

# Create testing agent
agent = Agent(
    llm=LLM(
        model="anthropic/claude-sonnet-4",
        api_key="your-api-key"
    ),
    tools=[Tool(name="BrowserAutomation")],
    skills=[self_healing_skill]
)

# Execute test
with LocalWorkspace("/workspace/tests") as workspace:
    conversation = Conversation(agent=agent, workspace=workspace)
    
    conversation.send_message(
        "Test login at https://example.com with user@test.com and password123"
    )
    conversation.run()
    
    # Access results
    print(f"Status: \{conversation.state.status\}")
    
    # Get screenshots
    for event in conversation.state.events:
        if hasattr(event, 'screenshots'):
            print(f"Screenshots: \{len(event.screenshots)\}")
```

**Run the test:**

```bash
python my_test.py
```

### 2. Multi-Agent Workflow

For complex testing workflows with code generation:

```python
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres import PostgresSaver
from typing import TypedDict, Annotated
from langgraph.graph import add_messages

# Define state
class KiteGraphState(TypedDict):
    messages: Annotated[list, add_messages]
    browsing_result: dict | None
    code_path: str | None

# Create browsing subgraph
def browsing_subgraph(state: KiteGraphState):
    user_msg = state["messages"][-1]["content"]
    
    with LocalWorkspace("/workspace/tests") as workspace:
        conversation = Conversation(
            agent=browsing_agent,
            workspace=workspace
        )
        conversation.send_message(user_msg)
        conversation.run()
        
        return \{
            "browsing_result": \{
                "status": conversation.state.status.value,
                "events": [e.to_dict() for e in conversation.state.events]
            \}
        \}

# Build workflow
workflow = StateGraph(KiteGraphState)
workflow.add_node("browsing_agent", browsing_subgraph)
workflow.add_node("coding_agent", coding_subgraph)
workflow.set_entry_point("browsing_agent")
workflow.add_edge("browsing_agent", "coding_agent")
workflow.add_edge("coding_agent", END)

# Add persistence
checkpointer = PostgresSaver.from_conn_string(
    "postgresql://localhost/kite"
)
graph = workflow.compile(checkpointer=checkpointer)

# Execute with session
result = graph.invoke(
    \{
        "messages": [\{
            "role": "user",
            "content": "Test checkout flow and generate Playwright code"
        \}]
    \},
    config=\{"configurable": \{"thread_id": "test-checkout-001"\}\}
)

print(f"Test Status: \{result['browsing_result']['status']\}")
print(f"Generated Code: \{result['code_path']\}")
```

## Configuration

### LLM Configuration

```python
# Anthropic Claude (recommended)
llm = LLM(
    model="anthropic/claude-sonnet-4",
    api_key="your-anthropic-key",
    temperature=0.0  # Conservative for testing
)

# OpenAI
llm = LLM(
    model="gpt-4",
    api_key="your-openai-key",
    temperature=0.0
)
```

### Workspace Configuration

```python
# Local development
workspace = LocalWorkspace("/workspace/tests")

# Production (Docker container)
from openhands.sdk.workspace import RemoteWorkspace
workspace = RemoteWorkspace(container_url="http://test-runner:8000")
```

### Testing Skills

```python
from kite_agent.skills import (
    self_healing_skill,        # Auto-fix selectors
    visual_regression_skill,   # Screenshot comparison
    test_generation_skill      # Generate test code
)

agent = Agent(
    llm=llm,
    tools=[Tool(name="BrowserAutomation")],
    skills=[
        self_healing_skill,
        visual_regression_skill,
        test_generation_skill
    ]
)
```

## Accessing Test Results

### Check Test Status

```python
print(f"Status: \{conversation.state.status\}")
# Output: ConversationStatus.FINISHED
```

### Get Test Events

```python
from openhands.sdk.event import ActionEvent, ObservationEvent

# All test actions
actions = [e for e in conversation.state.events if isinstance(e, ActionEvent)]
print(f"Performed \{len(actions)\} actions")

# Check for failures
failures = [e for e in conversation.state.events 
            if isinstance(e, ObservationEvent) and not e.success]
if failures:
    print(f"Failed at: \{failures[0].content\}")
```

### Extract Screenshots

```python
screenshots = []
for event in conversation.state.events:
    if hasattr(event, 'screenshots'):
        screenshots.extend(event.screenshots)

print(f"Captured \{len(screenshots)\} screenshots")
```

### Access Workspace Artifacts

```python
import os

# Screenshots
screenshot_dir = os.path.join(workspace.working_dir, "artifacts/screenshots")

# Videos
video_dir = os.path.join(workspace.working_dir, "artifacts/videos")

# HAR files (network logs)
har_dir = os.path.join(workspace.working_dir, "artifacts/har")

# Generated test code
generated_dir = os.path.join(workspace.working_dir, "generated")
```

## Common Patterns

### Test Multiple Pages

```python
# Test flow across multiple pages
conversation.send_message(
    """
    1. Login at https://example.com with user@test.com
    2. Navigate to /products
    3. Add first item to cart
    4. Go to checkout
    5. Verify order summary
    """
)
conversation.run()
```

### Visual Regression Testing

```python
conversation.send_message(
    "Take screenshot of homepage and compare with baseline"
)
conversation.run()

# Baseline stored in: test-data/baselines/homepage.png
# Comparison saved to: artifacts/screenshots/homepage_diff.png
```

### Self-Healing Selectors

```python
# Agent automatically recovers from broken selectors
conversation.send_message(
    "Click the submit button"  # Finds button even if selector changed
)
conversation.run()

# Check logs for selector changes
for event in conversation.state.events:
    if "selector changed" in str(event.content):
        print(f"Auto-fixed: \{event.content\}")
```

### Resume Testing Session

```python
# First run
result1 = graph.invoke(
    \{"messages": [\{"role": "user", "content": "Test login"\}]\},
    config=\{"configurable": \{"thread_id": "session-123"\}\}
)

# Continue later (auto-resumes from checkpoint)
result2 = graph.invoke(
    \{"messages": [\{"role": "user", "content": "Now test checkout"\}]\},
    config=\{"configurable": \{"thread_id": "session-123"\}\}
)
```

## Debugging

### Enable Verbose Logging

```python
import logging

logging.basicConfig(level=logging.DEBUG)
```

### Replay Events

```python
# Time-travel debugging
for i, event in enumerate(conversation.state.events):
    print(f"Step \{i\}: \{event.event_type\}")
    if isinstance(event, ObservationEvent):
        print(f"  Result: \{event.content\}")
```

### Check Tool Execution

```python
# See what browser-use did
for event in conversation.state.events:
    if isinstance(event, ActionEvent) and event.tool == "browser_automation":
        print(f"Browser task: \{event.task\}")
    if isinstance(event, ObservationEvent) and hasattr(event, 'history'):
        print(f"Browser actions: \{len(event.history)\}")
```

## Next Steps

- [Examples](/docs/examples/basic-test) - More test scenarios
- [Agents Guide](/docs/guides/agents) - Deep dive into agents
- [Tools Guide](/docs/guides/tools) - Custom tool development
- [Workflows Guide](/docs/guides/workflows) - Complex workflows
