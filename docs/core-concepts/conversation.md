---
sidebar_position: 5
---

# Conversation

**OpenHands Conversation** is the single source of truth for test execution, storing all events immutably.

## Core Concept

```python
from openhands.sdk import Conversation, Agent
from openhands.sdk.workspace import LocalWorkspace

# Create conversation with agent + workspace
with LocalWorkspace("/workspace/tests") as workspace:
    conversation = Conversation(
        agent=browsing_agent,
        workspace=workspace
    )
    
    # Send message and execute
    conversation.send_message("Test login flow")
    conversation.run()
    
    # Access complete history
    print(f"Status: \{conversation.state.status.value\}")
    print(f"Events: \{len(conversation.state.events)\}")
```

**Key Properties:**
- **Immutable**: Events cannot be modified after creation
- **Complete History**: Every action/observation recorded
- **Time-Travel**: Replay to any point in execution
- **Stateless Agent**: Agent logic reads from Conversation, doesn't hold state

## Creating Conversations

### Basic Creation

```python
from openhands.sdk import Conversation, Agent, LLM
from openhands.sdk.workspace import LocalWorkspace
from openhands.sdk.tool import Tool

# Setup agent
agent = Agent(
    llm=LLM(model="anthropic/claude-sonnet-4"),
    tools=[Tool(name="BrowserAutomation")],
)

# Create with local workspace
with LocalWorkspace("/workspace/tests") as workspace:
    conversation = Conversation(
        agent=agent,
        workspace=workspace
    )
```

### With Remote Workspace

```python
from openhands.sdk.workspace import RemoteWorkspace

# Production: Isolated Docker container
with RemoteWorkspace(container_url="http://test-runner:8000") as workspace:
    conversation = Conversation(
        agent=agent,
        workspace=workspace
    )
```

## Executing Tests

### Basic Execution

```python
# Send user message
conversation.send_message("Test login at https://example.com with user@test.com")

# Execute agent reasoning-action loop
conversation.run()

# Check status
if conversation.state.status.value == "success":
    print("Test passed")
else:
    print(f"Test failed: \{conversation.state.status.value\}")
```

### Step-by-Step Execution

```python
# Send message
conversation.send_message("Test checkout flow")

# Run with step limit
conversation.run(max_steps=10)

# Continue if needed
if conversation.state.status.value == "running":
    conversation.run(max_steps=5)
```

### Multiple Test Steps

```python
with LocalWorkspace("/workspace") as ws:
    conversation = Conversation(agent, ws)
    
    # Step 1: Login
    conversation.send_message("Login with user@test.com")
    conversation.run()
    
    # Step 2: Navigate
    conversation.send_message("Go to products page")
    conversation.run()
    
    # Step 3: Add to cart
    conversation.send_message("Add first 2 products to cart")
    conversation.run()
    
    # Step 4: Checkout
    conversation.send_message("Complete checkout")
    conversation.run()
```

## Accessing Test Results

### Status and Events

```python
# Test execution status
status = conversation.state.status.value
# Values: "running", "success", "error", "stopped"

# All events
events = conversation.state.events
print(f"Total steps: \{len(events)\}")

# Filter by type
actions = [e for e in events if isinstance(e, ActionEvent)]
observations = [e for e in events if isinstance(e, ObservationEvent)]
messages = [e for e in events if isinstance(e, MessageEvent)]
```

### Test Artifacts

```python
# Find screenshots
screenshots = []
for event in conversation.state.events:
    if hasattr(event, 'screenshot'):
        screenshots.append(event.screenshot)

print(f"Captured \{len(screenshots)\} screenshots")

# Find failures
failures = []
for event in conversation.state.events:
    if isinstance(event, ObservationEvent) and not event.success:
        failures.append(event)

if failures:
    print(f"Test failed at: \{failures[0].content\}")
```

### Browser-use Action History

```python
# Extract browser-use execution details
for event in conversation.state.events:
    if isinstance(event, ObservationEvent) and hasattr(event, 'history'):
        # browser-use action history
        for step in event.history:
            print(f"Browser action: \{step['action']\}")
            print(f"Result: \{step['result']\}")
```

## Event Patterns

### Action-Observation Pattern

Every tool execution follows: `ActionEvent → Tool → ObservationEvent`

```python
# Agent decides to use browser tool
conversation.send_message("Click login button")
conversation.run()

# Results in events:
# 1. MessageEvent(content="Click login button", source="user")
# 2. AgentStateEvent(content="Planning: need to interact with browser")
# 3. BrowserTestAction(tool="browser_automation", task="click login button")
# 4. BrowserTestObservation(success=True, result="Clicked button", screenshots=[...])
# 5. MessageEvent(content="Clicked login button successfully", source="agent")
```

### Event Types in Testing

```python
from openhands.sdk.event import (
    MessageEvent,      # User/agent messages
    ActionEvent,       # Tool calls
    ObservationEvent,  # Tool results
    AgentStateEvent,   # Agent thinking
)

# Access specific event types
for event in conversation.state.events:
    if isinstance(event, ActionEvent):
        print(f"Tool call: \{event.tool\}")
    elif isinstance(event, ObservationEvent):
        print(f"Tool result: \{event.content\}")
```

## Time-Travel Debugging

### Replay Test Execution

```python
# Get event at specific step
step_5_event = conversation.state.events[5]
print(f"At step 5: \{step_5_event.content\}")

# Find failure point
for i, event in enumerate(conversation.state.events):
    if isinstance(event, ObservationEvent) and not event.success:
        print(f"Test failed at step \{i\}")
        print(f"Error: \{event.content\}")
        
        # Check previous actions for context
        prev_actions = [e for e in conversation.state.events[:i] 
                       if isinstance(e, ActionEvent)]
        print(f"Previous actions: \{prev_actions[-3:]\}")
```

### Debug with Screenshots

```python
# Get screenshots leading to failure
screenshots_before_failure = []
for i, event in enumerate(conversation.state.events):
    if hasattr(event, 'screenshot'):
        screenshots_before_failure.append(\{
            'step': i,
            'screenshot': event.screenshot,
            'timestamp': event.timestamp
        \})
    
    if isinstance(event, ObservationEvent) and not event.success:
        break

# Save screenshots for debugging
import os
for img in screenshots_before_failure:
    with open(f"debug/step_\{img['step']\}.png", 'wb') as f:
        # Decode base64 screenshot
        import base64
        f.write(base64.b64decode(img['screenshot']))
```

## Conversation Lifecycle

### Complete Test Session

```python
from openhands.sdk import Conversation, Agent, LLM
from openhands.sdk.workspace import LocalWorkspace
from openhands.sdk.tool import Tool
import time

# 1. Setup
agent = Agent(
    llm=LLM(model="anthropic/claude-sonnet-4"),
    tools=[Tool(name="BrowserAutomation")],
)

# 2. Create conversation
with LocalWorkspace("/workspace/tests") as workspace:
    conversation = Conversation(agent=agent, workspace=workspace)
    
    # 3. Execute test
    start_time = time.time()
    conversation.send_message("Test complete user journey from signup to purchase")
    conversation.run()
    duration = time.time() - start_time
    
    # 4. Collect results
    result = \{
        'status': conversation.state.status.value,
        'duration': duration,
        'steps': len(conversation.state.events),
        'screenshots': len([e for e in conversation.state.events if hasattr(e, 'screenshot')]),
        'failures': len([e for e in conversation.state.events 
                        if isinstance(e, ObservationEvent) and not e.success]),
    \}
    
    # 5. Generate report
    print(f"Test Results:")
    print(f"  Status: \{result['status']\}")
    print(f"  Duration: \{result['duration']:.2f\}s")
    print(f"  Steps: \{result['steps']\}")
    print(f"  Screenshots: \{result['screenshots']\}")
    print(f"  Failures: \{result['failures']\}")
    
    # 6. Save artifacts
    if result['status'] == 'success':
        # Save to workspace
        import json
        workspace.write_file(
            'reports/test_results.json',
            json.dumps(result, indent=2)
        )
```

## Persistence Patterns

### Save Conversation State

```python
# Export events for reporting
import json

events_data = [e.to_dict() for e in conversation.state.events]

with open('test_session.json', 'w') as f:
    json.dump(\{
        'status': conversation.state.status.value,
        'events': events_data,
        'timestamp': time.time()
    \}, f, indent=2)
```

### Multi-Session Testing with LangGraph

```python
from langgraph.checkpoint.postgres import PostgresSaver

# LangGraph manages conversation threads
checkpointer = PostgresSaver.from_conn_string("postgresql://localhost/kite")

# Each thread is a test session
config = \{"configurable": \{"thread_id": "test-login-001"\}\}

# Execute test
result = graph.invoke(
    \{"messages": [\{"role": "user", "content": "Test login"\}]\},
    config=config
)

# Resume later (auto-loads from checkpoint)
result2 = graph.invoke(
    \{"messages": [\{"role": "user", "content": "Now test logout"\}]\},
    config=config  # Same thread_id
)
```

## Testing Patterns

### Pattern 1: Single Test Execution

```python
with LocalWorkspace("/workspace") as ws:
    conv = Conversation(agent, ws)
    conv.send_message("Test login with user@test.com")
    conv.run()
    
    assert conv.state.status.value == "success"
```

### Pattern 2: Multi-Step Test Journey

```python
with LocalWorkspace("/workspace") as ws:
    conv = Conversation(agent, ws)
    
    steps = [
        "Navigate to https://example.com",
        "Click signup button",
        "Fill form: name=Test User, email=test@example.com",
        "Submit form",
        "Verify welcome message appears"
    ]
    
    for step in steps:
        conv.send_message(step)
        conv.run()
        
        if conv.state.status.value != "success":
            print(f"Failed at step: \{step\}")
            break
```

### Pattern 3: Parallel Test Execution

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

def run_test(test_spec):
    """Execute single test"""
    with LocalWorkspace("/workspace") as ws:
        conv = Conversation(agent, ws)
        conv.send_message(test_spec['scenario'])
        conv.run()
        
        return \{
            'test_id': test_spec['id'],
            'status': conv.state.status.value,
            'events': conv.state.events
        \}

# Run tests in parallel
test_specs = [
    \{'id': 'TC-001', 'scenario': 'Test login'\},
    \{'id': 'TC-002', 'scenario': 'Test registration'\},
    \{'id': 'TC-003', 'scenario': 'Test checkout'\},
]

with ThreadPoolExecutor(max_workers=3) as executor:
    results = list(executor.map(run_test, test_specs))

for result in results:
    print(f"\{result['test_id']\}: \{result['status']\}")
```

## Next Steps

- **[Events](/docs/core-concepts/events)** - Understanding event types
- **[Agents](/docs/core-concepts/agents)** - Agent configuration
- **[Guides: Getting Started](/docs/guides/getting-started)** - Complete examples
