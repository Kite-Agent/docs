---
sidebar_position: 2
---

# Working with Agents

Practical guide to using OpenHands Agents for testing with KiteAgent.

## Agent Fundamentals

KiteAgent uses **OpenHands Agent** directly, specialized through tools and skills:

```python
from openhands.sdk import Agent, LLM
from openhands.sdk.tool import Tool

# Pure OpenHands Agent, configured for testing
agent = Agent(
    llm=LLM(model="anthropic/claude-sonnet-4"),
    tools=[Tool(name="BrowserAutomation")],  # browser-use
    skills=[self_healing_skill],             # Testing expertise
)
```

**Remember:** There is no `BrowsingAgent` or `CodingAgent` class. These are just **configurations** of OpenHands Agent with different tools/skills.

## Single Agent Testing

### Basic Test Execution

```python
from openhands.sdk import Agent, Conversation, LLM
from openhands.sdk.workspace import LocalWorkspace
from openhands.sdk.tool import Tool

# Setup agent
agent = Agent(
    llm=LLM(model="anthropic/claude-sonnet-4"),
    tools=[Tool(name="BrowserAutomation")],
)

# Execute test
with LocalWorkspace("/workspace/tests") as workspace:
    conversation = Conversation(agent=agent, workspace=workspace)
    
    # Send test request
    conversation.send_message("Test login at https://example.com with user@test.com")
    
    # Execute
    conversation.run()
    
    # Check results
    if conversation.state.status.value == "success":
        print("✓ Test passed")
    else:
        print("✗ Test failed")
        
        # Debug failures
        for event in conversation.state.events:
            if isinstance(event, ObservationEvent) and not event.success:
                print(f"Failed: \{event.content\}")
```

### Multi-Step Test Journey

```python
with LocalWorkspace("/workspace/tests") as ws:
    conversation = Conversation(agent, ws)
    
    # Step 1: Login
    conversation.send_message("Login to https://example.com with user@test.com")
    conversation.run()
    
    # Step 2: Navigate
    conversation.send_message("Go to products page")
    conversation.run()
    
    # Step 3: Add items
    conversation.send_message("Add first 2 products to cart")
    conversation.run()
    
    # Step 4: Checkout
    conversation.send_message("Complete checkout flow")
    conversation.run()
    
    # Check final status
    print(f"Test status: \{conversation.state.status.value\}")
    print(f"Total steps: \{len(conversation.state.events)\}")
```

### Accessing Test Results

```python
# After test execution
conversation.run()

# Get all events
events = conversation.state.events

# Find screenshots
screenshots = []
for event in events:
    if hasattr(event, 'screenshots'):
        screenshots.extend(event.screenshots)

print(f"Captured \{len(screenshots)\} screenshots")

# Extract browser-use action history
for event in events:
    if isinstance(event, ObservationEvent) and hasattr(event, 'history'):
        print("\nbrowser-use actions:")
        for action in event.history:
            print(f"  - \{action['action']\}: \{action['result']\}")

# Check for failures
failures = [e for e in events if isinstance(e, ObservationEvent) and not e.success]
if failures:
    print(f"\nTest failed at: \{failures[0].content\}")
```

## Agent Configuration

### Production Agent (High Accuracy)

```python
from openhands.sdk import Agent, LLM
from openhands.sdk.tool import Tool
from openhands.sdk.context.skills import Skill, KeywordTrigger

# Self-healing with conservative retries
self_healing = Skill(
    name="self_healing",
    trigger=KeywordTrigger(keywords=["ElementNotFoundException"]),
    content="..."  # Self-healing instructions
)

# Production configuration
prod_agent = Agent(
    llm=LLM(
        model="anthropic/claude-sonnet-4",
        temperature=0.0,        # Deterministic
        max_tokens=8000
    ),
    tools=[Tool(name="BrowserAutomation")],
    skills=[self_healing],
)
```

### Development Agent (Fast Iteration)

```python
# Development configuration
dev_agent = Agent(
    llm=LLM(
        model="anthropic/claude-haiku-3-5",  # Faster, cheaper
        temperature=0.3,
        max_tokens=4000
    ),
    tools=[Tool(name="BrowserAutomation")],
)
```

### Specialized Agents

#### Browser Testing Agent

```python
# Agent for browser-based testing
browser_agent = Agent(
    llm=llm,
    tools=[Tool(name="BrowserAutomation")],
    skills=[
        self_healing_skill,
        visual_regression_skill
    ]
)

# Use
with LocalWorkspace("/workspace") as ws:
    conv = Conversation(browser_agent, ws)
    conv.send_message("Test entire checkout flow with visual verification")
    conv.run()
```

#### Code Generation Agent

```python
# Agent for generating test code
code_agent = Agent(
    llm=llm,
    tools=[Tool(name="FileEditorTool")],  # Built-in OpenHands tool
    skills=[test_generation_skill]
)

# Use
with LocalWorkspace("/workspace") as ws:
    conv = Conversation(code_agent, ws)
    conv.send_message(f"Generate Playwright test from: \{browsing_events\}")
    conv.run()
    
    # Generated code saved in workspace
    code_path = ws.read_file("generated/test.py")
```

#### API Testing Agent

```python
# Agent for API testing
api_agent = Agent(
    llm=llm,
    tools=[Tool(name="APITest")],  # Custom API tool
    skills=[api_contract_skill]
)

# Use
with LocalWorkspace("/workspace") as ws:
    conv = Conversation(api_agent, ws)
    conv.send_message("Test POST /api/users endpoint with invalid data")
    conv.run()
```

## Multi-Agent Workflows

### LangGraph Coordination

```python
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres import PostgresSaver
from typing import TypedDict, Annotated
from langgraph.graph import add_messages

# Define state
class TestWorkflowState(TypedDict):
    messages: Annotated[list, add_messages]
    test_result: dict | None
    code_path: str | None

# Wrap agents as subgraphs
def browser_test_node(state):
    """Execute browser test"""
    with LocalWorkspace("/workspace/tests") as ws:
        conv = Conversation(browser_agent, ws)
        conv.send_message(state["messages"][-1]["content"])
        conv.run()
        
        return \{
            "test_result": \{
                "status": conv.state.status.value,
                "events": [e.to_dict() for e in conv.state.events]
            \}
        \}

def code_gen_node(state):
    """Generate test code"""
    with LocalWorkspace("/workspace/tests") as ws:
        conv = Conversation(code_agent, ws)
        conv.send_message(f"Generate Playwright code from: \{state['test_result']\}")
        conv.run()
        
        return \{"code_path": "generated/test.py"\}

# Build workflow
workflow = StateGraph(TestWorkflowState)
workflow.add_node("browser_test", browser_test_node)
workflow.add_node("code_gen", code_gen_node)
workflow.add_edge("browser_test", "code_gen")
workflow.add_edge("code_gen", END)
workflow.set_entry_point("browser_test")

# Compile with memory
checkpointer = PostgresSaver.from_conn_string("postgresql://localhost/kite")
graph = workflow.compile(checkpointer=checkpointer)

# Execute
result = graph.invoke(
    \{
        "messages": [\{
            "role": "user",
            "content": "Test login flow and generate Playwright code"
        \}]
    \},
    config=\{"configurable": \{"thread_id": "test-001"\}\}
)

print(f"Test: \{result['test_result']['status']\}")
print(f"Code: \{result['code_path']\}")
```

### Supervisor Pattern

```python
def supervisor_node(state):
    """Route to appropriate agent"""
    user_msg = state["messages"][-1]["content"].lower()
    
    if "test" in user_msg or "browser" in user_msg:
        return "browser_agent"
    elif "generate" in user_msg or "code" in user_msg:
        return "code_agent"
    elif "api" in user_msg:
        return "api_agent"
    else:
        return "browser_agent"  # Default

# Add supervisor to workflow
workflow.add_node("supervisor", supervisor_node)
workflow.add_conditional_edges("supervisor", supervisor_node)
workflow.set_entry_point("supervisor")
```

## Testing Patterns

### Pattern 1: Assertion Pattern

```python
with LocalWorkspace("/workspace") as ws:
    conv = Conversation(agent, ws)
    
    # Execute action
    conv.send_message("Click submit button")
    conv.run()
    
    # Verify result
    success = conv.state.status.value == "success"
    assert success, "Submit button click failed"
    
    # Verify specific outcome
    conv.send_message("Extract text from confirmation message")
    conv.run()
    
    # Check extracted content from events
    for event in conv.state.events:
        if hasattr(event, 'result') and 'Order confirmed' in str(event.result):
            print("✓ Confirmation message found")
            break
```

### Pattern 2: Conditional Testing

```python
def test_with_conditions(agent):
    with LocalWorkspace("/workspace") as ws:
        conv = Conversation(agent, ws)
        
        # Check condition
        conv.send_message("Check if product is in stock")
        conv.run()
        
        # Analyze result
        in_stock = False
        for event in conv.state.events:
            if 'In Stock' in str(event.content):
                in_stock = True
                break
        
        # Take action based on condition
        if in_stock:
            conv.send_message("Add product to cart")
        else:
            conv.send_message("Click notify me button")
        
        conv.run()
```

### Pattern 3: Data-Driven Testing

```python
test_cases = [
    \{"user": "user1@test.com", "pass": "password1", "expect": "success"\},
    \{"user": "user2@test.com", "pass": "wrong", "expect": "failure"\},
    \{"user": "invalid-email", "pass": "password3", "expect": "error"\},
]

results = []

for case in test_cases:
    with LocalWorkspace("/workspace") as ws:
        conv = Conversation(agent, ws)
        
        conv.send_message(f"Test login with \{case['user']\} and \{case['pass']\}")
        conv.run()
        
        actual = conv.state.status.value
        passed = (case['expect'] == "success" and actual == "success") or \
                 (case['expect'] in ["failure", "error"] and actual != "success")
        
        results.append(\{
            "case": case,
            "actual": actual,
            "passed": passed
        \})

# Report
for r in results:
    status = "✓" if r["passed"] else "✗"
    print(f"\{status\} \{r['case']['user']\}: \{r['actual']\}")
```

### Pattern 4: Parallel Execution

```python
from concurrent.futures import ThreadPoolExecutor

def run_single_test(test_spec):
    """Execute one test case"""
    with LocalWorkspace("/workspace") as ws:
        conv = Conversation(agent, ws)
        conv.send_message(test_spec["scenario"])
        conv.run()
        
        return \{
            "id": test_spec["id"],
            "status": conv.state.status.value,
            "duration": len(conv.state.events)
        \}

# Run tests in parallel
test_specs = [
    \{"id": "TC-001", "scenario": "Test login"\},
    \{"id": "TC-002", "scenario": "Test registration"\},
    \{"id": "TC-003", "scenario": "Test password reset"\},
]

with ThreadPoolExecutor(max_workers=3) as executor:
    results = list(executor.map(run_single_test, test_specs))

for result in results:
    print(f"\{result['id']\}: \{result['status']\} (\{result['duration']\} steps)")
```

## Debugging Agents

### Enable Verbose Logging

```python
import logging

logging.basicConfig(level=logging.DEBUG)

# Now agent actions are logged
conversation.run()
```

### Inspect Events

```python
# After execution, replay events
for i, event in enumerate(conversation.state.events):
    print(f"\nStep \{i\}: \{event.event_type\}")
    
    if isinstance(event, ActionEvent):
        print(f"  Tool: \{event.tool\}")
        print(f"  Args: \{event.args\}")
    elif isinstance(event, ObservationEvent):
        print(f"  Success: \{event.success\}")
        print(f"  Result: \{event.content\}")
```

### Save Debug Artifacts

```python
import json
import base64

# Save conversation events
events_data = [e.to_dict() for e in conversation.state.events]
with open("debug/events.json", "w") as f:
    json.dump(events_data, f, indent=2)

# Save screenshots
for i, event in enumerate(conversation.state.events):
    if hasattr(event, 'screenshots'):
        for j, screenshot in enumerate(event.screenshots):
            with open(f"debug/step_\{i\}_screenshot_\{j\}.png", "wb") as f:
                f.write(base64.b64decode(screenshot))
```

## Next Steps

- **[Tools](/docs/guides/tools)** - Create custom tools
- **[Workflows](/docs/guides/workflows)** - Multi-agent orchestration
- **[Examples](/docs/examples/basic-test)** - Complete examples
