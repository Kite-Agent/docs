---
sidebar_position: 3
---

# Agents

KiteAgent uses **OpenHands Agents** directly - specialized for testing through tools and skills, not custom classes.

## Agent Architecture

```python
from openhands.sdk import Agent
from openhands.sdk.tool import Tool

# Create testing agent - pure OpenHands SDK
browsing_agent = Agent(
    llm=llm,
    tools=[Tool(name="BrowserAutomation")],  # browser-use registered
    skills=[self_healing_skill],             # Testing expertise
)
```

**Key Principle:** KiteAgent does not define custom agent classes like `BrowsingAgent` or `CodingAgent`. Instead, it uses **OpenHands Agent** configured with testing-specific tools and skills.

## Testing Agent Configurations

### Browser Test Execution

```python
from openhands.sdk import Agent, LLM
from openhands.sdk.tool import Tool
from openhands.sdk.context.skills import Skill, KeywordTrigger

# Self-healing skill
self_healing = Skill(
    name="self_healing",
    trigger=KeywordTrigger(keywords=["ElementNotFoundException", "selector failed"]),
    content="""
    When selector fails:
    1. Take screenshot
    2. Use browser-use extract to find similar elements
    3. Generate new robust selector (prefer test IDs > aria > CSS)
    4. Log change to Conversation
    5. Continue test
    """
)

# Browser testing agent
browsing_agent = Agent(
    llm=LLM(model="anthropic/claude-sonnet-4"),
    tools=[Tool(name="BrowserAutomation")],  # browser-use tool
    skills=[self_healing],
)
```

### Test Code Generation

```python
# Test generation skill
test_gen_skill = Skill(
    name="test_generation",
    trigger=KeywordTrigger(keywords=["generate test", "create test code"]),
    content="""
    Generate test code from conversation history:
    1. Extract browser-use actions from events (navigate, click, input)
    2. Convert to Playwright/Selenium with Page Object Model
    3. Add assertions from extract results
    4. Include setup/teardown, fixtures
    5. Save to workspace: generated/\{test_name\}_test.py
    """
)

# Code generation agent
coding_agent = Agent(
    llm=LLM(model="anthropic/claude-sonnet-4"),
    tools=[Tool(name="FileEditorTool")],  # Built-in OpenHands tool
    skills=[test_gen_skill],
)
```

### Visual Regression Testing

```python
visual_skill = Skill(
    name="visual_regression",
    trigger=KeywordTrigger(keywords=["screenshot", "visual check"]),
    content="""
    For visual verification:
    1. Take screenshot of element/page
    2. Save to workspace: artifacts/screenshots/\{name\}_\{timestamp\}.png
    3. If baseline exists, compare using image diff
    4. Report differences > 5% as regression
    5. Store baseline in: test-data/baselines/
    """
)

visual_agent = Agent(
    llm=llm,
    tools=[Tool(name="BrowserAutomation")],
    skills=[visual_skill],
)
```

## Agent Execution

### Single Agent

```python
from openhands.sdk import Conversation
from openhands.sdk.workspace import LocalWorkspace

# Create conversation with workspace
with LocalWorkspace("/workspace/tests") as workspace:
    conversation = Conversation(
        agent=browsing_agent,
        workspace=workspace
    )
    
    # Send test task
    conversation.send_message("Test login at https://example.com with user@test.com")
    
    # Execute
    conversation.run()
    
    # Check results
    print(f"Status: \{conversation.state.status.value\}")
    
    # Access events
    for event in conversation.state.events:
        print(f"\{event.event_type\}: \{event.content\}")
```

### Multi-Agent with LangGraph

```python
from langgraph.graph import StateGraph
from langgraph.checkpoint.postgres import PostgresSaver

def browsing_subgraph(state):
    """Wrap OpenHands Agent as LangGraph node"""
    with LocalWorkspace("/workspace/tests") as workspace:
        conversation = Conversation(agent=browsing_agent, workspace=workspace)
        conversation.send_message(state["messages"][-1]["content"])
        conversation.run()
        
        return \{
            "browsing_result": \{
                "status": conversation.state.status.value,
                "events": [e.to_dict() for e in conversation.state.events]
            \}
        \}

def coding_subgraph(state):
    """Code generation agent"""
    with LocalWorkspace("/workspace/tests") as workspace:
        conversation = Conversation(agent=coding_agent, workspace=workspace)
        conversation.send_message(f"Generate test code from: \{state['browsing_result']\}")
        conversation.run()
        
        return \{"code_path": "generated/login_test.py"\}

# Define workflow
workflow = StateGraph(KiteGraphState)
workflow.add_node("browsing", browsing_subgraph)
workflow.add_node("coding", coding_subgraph)
workflow.add_edge("browsing", "coding")

# Compile with memory
checkpointer = PostgresSaver.from_conn_string(DB_URI)
graph = workflow.compile(checkpointer=checkpointer)

# Execute
result = graph.invoke(
    \{"messages": [\{"role": "user", "content": "Test login and generate code"\}]\},
    config=\{"configurable": \{"thread_id": "test-001"\}\}
)
```

## Agent Capabilities

### What OpenHands Provides

| Capability | How KiteAgent Uses It |
|------------|----------------------|
| **Stateless Logic** | Agent reads from Conversation, doesn't hold state |
| **Tool Integration** | Inject browser-use via Tool registration |
| **Skill System** | Add testing expertise (self-healing, visual regression) |
| **Event Store** | Conversation tracks all test execution steps |
| **Workspace** | Isolated file system for test artifacts |

### Testing Specialization

| Generic (OpenHands) | Testing (KiteAgent) |
|---------------------|---------------------|
| File operations | browser-use for UI testing |
| Bash commands | Screenshot capture |
| Code generation | Test code generation |
| Generic skills | Self-healing selectors |
| Workspace files | Test artifacts (screenshots, videos, HAR) |

## Agent Patterns

### Pattern 1: Test Execution Agent

```python
# Agent that executes manual tests
test_agent = Agent(
    llm=llm,
    tools=[Tool(name="BrowserAutomation")],
    skills=[self_healing_skill, visual_regression_skill],
)

with LocalWorkspace("/workspace") as ws:
    conv = Conversation(test_agent, ws)
    conv.send_message("Test checkout flow: add 2 items, apply coupon, complete purchase")
    conv.run()
```

### Pattern 2: Code Generation Agent

```python
# Agent that converts manual tests to code
code_gen_agent = Agent(
    llm=llm,
    tools=[Tool(name="FileEditorTool")],
    skills=[test_generation_skill],
)

# Use browsing results to generate code
with LocalWorkspace("/workspace") as ws:
    conv = Conversation(code_gen_agent, ws)
    conv.send_message(f"Generate Playwright code from: \{browsing_events\}")
    conv.run()
```

### Pattern 3: Supervisor Coordination

```python
# Supervisor routes between agents
def supervisor_node(state):
    """Decide which agent to use"""
    user_msg = state["messages"][-1]["content"]
    
    if "test" in user_msg.lower():
        return "browsing_agent"
    elif "generate code" in user_msg.lower():
        return "coding_agent"
    else:
        return "browsing_agent"  # Default

workflow.add_conditional_edges("supervisor", supervisor_node)
```

## Configuration Options

### LLM Selection

```python
from openhands.sdk import LLM

# Production: High accuracy
agent = Agent(
    llm=LLM(
        model="anthropic/claude-sonnet-4",
        temperature=0.0,
        max_tokens=8000
    ),
    tools=[Tool(name="BrowserAutomation")],
)

# Development: Fast iteration
agent = Agent(
    llm=LLM(
        model="anthropic/claude-haiku-3-5",
        temperature=0.3,
        max_tokens=4000
    ),
    tools=[Tool(name="BrowserAutomation")],
)
```

### Workspace Configuration

```python
# Local development
with LocalWorkspace("/workspace/tests") as ws:
    conv = Conversation(agent, ws)

# Production: Isolated containers
from openhands.sdk.workspace import RemoteWorkspace

with RemoteWorkspace(container_url="http://test-runner:8000") as ws:
    conv = Conversation(agent, ws)
```

### Tool Configuration

```python
from openhands.sdk.tool import register_tool

# Register browser-use with custom actions
class BrowserUseTool(ToolDefinition):
    @classmethod
    def create(cls, conv_state, **params):
        from browser_use import Tools
        
        tools = Tools()
        
        # Add custom browser action
        @tools.action(description='Extract test data')
        async def extract_test_data(prompt: str, browser_session):
            page = await browser_session.must_get_current_page()
            return await page.extract_content(prompt, llm=conv_state.agent.llm)
        
        return [cls(
            name="browser_automation",
            llm=conv_state.agent.llm,
            tools=tools,
        )]

register_tool("BrowserAutomation", BrowserUseTool)
```

## Next Steps

- **[Conversation](/docs/core-concepts/conversation)** - Managing test sessions
- **[Tools & Skills](/docs/core-concepts/tools-and-skills)** - Extending capabilities
- **[Guides: Agents](/docs/guides/agents)** - Practical examples
