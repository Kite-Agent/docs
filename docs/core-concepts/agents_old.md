---
sidebar_position: 3
---

# Agents

KiteAgent provides **pre-configured agent classes** specialized for testing - built on OpenHands SDK with tools and skills included.

## Agent Classes

KiteAgent defines three main agent classes:

```python
from kiteagent import BrowsingAgent, CodingAgent, VisualRegressionAgent

# Ready to use - pre-configured with tools & skills
browser_agent = BrowsingAgent(llm=llm)
code_agent = CodingAgent(llm=llm)
visual_agent = VisualRegressionAgent(llm=llm)
```

**Key Benefits:**
- ✅ Pre-configured tools (browser-use, file editor)
- ✅ Pre-loaded skills (self-healing, test generation)
- ✅ Customizable - add your own tools/skills
- ✅ Built on OpenHands SDK - full compatibility

## BrowsingAgent

Executes manual tests in browser with self-healing capabilities.

### Basic Usage

```python
from kiteagent import BrowsingAgent
from openhands.sdk import LLM, Conversation
from openhands.sdk.workspace import LocalWorkspace

# Create agent - tools & skills pre-configured
agent = BrowsingAgent(
    llm=LLM(model="anthropic/claude-sonnet-4")
)

# Execute test
with LocalWorkspace("/workspace/tests") as workspace:
    conversation = Conversation(agent=agent, workspace=workspace)
    conversation.send_message("Test login at https://example.com with user@test.com")
    conversation.run()
    
    print(f"Status: \{conversation.state.status.value\}")
```

### Pre-configured Features

**Tools:**
- `BrowserAutomation` - browser-use integration (20+ actions)

**Skills:**
- `self_healing` - Auto-fix broken selectors
- `screenshot_capture` - Visual evidence collection
- `wait_handling` - Smart wait strategies

### Customization

```python
from openhands.sdk.context.skills import Skill, KeywordTrigger

# Add custom skill
custom_skill = Skill(
    name="api_setup",
    trigger=KeywordTrigger(keywords=["setup test data", "create user"]),
    content="""
    Before browser testing:
    1. Create test user via API POST /api/users
    2. Get auth token from response
    3. Save to workspace: test-data/auth.json
    4. Use token in browser cookies
    """
)

# Customize BrowsingAgent
agent = BrowsingAgent(
    llm=llm,
    custom_skills=[custom_skill],  # Add your skills
    enable_self_healing=True,       # Toggle built-in features
    screenshot_on_error=True,
)
```

### Implementation

```python
# kiteagent/agents/browsing.py
from openhands.sdk import Agent
from openhands.sdk.tool import Tool
from openhands.sdk.context.skills import Skill, KeywordTrigger

class BrowsingAgent(Agent):
    """Pre-configured agent for browser testing"""
    
    def __init__(
        self,
        llm,
        custom_tools=None,
        custom_skills=None,
        enable_self_healing=True,
        screenshot_on_error=True,
    ):
        # Build skills list
        skills = []
        
        if enable_self_healing:
            skills.append(self._create_self_healing_skill())
        
        if screenshot_on_error:
            skills.append(self._create_screenshot_skill())
        
        # Add custom skills
        if custom_skills:
            skills.extend(custom_skills)
        
        # Build tools list
        tools = [Tool(name="BrowserAutomation")]
        if custom_tools:
            tools.extend(custom_tools)
        
        # Initialize OpenHands Agent
        super().__init__(llm=llm, tools=tools, skills=skills)
    
    @staticmethod
    def _create_self_healing_skill():
        return Skill(
            name="self_healing",
            trigger=KeywordTrigger(keywords=["ElementNotFoundException", "selector failed"]),
            content="""
            When selector fails:
            1. Take screenshot for visual analysis
            2. Use browser-use extract to find similar elements
            3. Generate new robust selector (prefer test IDs > aria > CSS)
            4. Log selector change to Conversation
            5. Continue test execution
            """
        )
    
    @staticmethod
    def _create_screenshot_skill():
        return Skill(
            name="screenshot_capture",
            trigger=KeywordTrigger(keywords=["error", "failed", "exception"]),
            content="""
            On test failure:
            1. Capture full page screenshot
            2. Save to: artifacts/screenshots/error_\{timestamp\}.png
            3. Capture DOM snapshot
            4. Save console logs
            5. Include all in error report
            """
        )

## CodingAgent

Generates test code from manual test execution history.

### Basic Usage

```python
from kiteagent import CodingAgent

# Create agent - pre-configured for code generation
agent = CodingAgent(
    llm=LLM(model="anthropic/claude-sonnet-4"),
    default_framework="playwright"  # or "selenium", "cypress"
)

# Generate code from manual test
with LocalWorkspace("/workspace/tests") as workspace:
    conversation = Conversation(agent=agent, workspace=workspace)
    conversation.send_message("""
        Generate Playwright test code from the manual test execution.
        Use Page Object Model pattern with explicit waits.
    """)
    conversation.run()
    
    # Read generated code
    code = workspace.read_file("generated/login_test.py")
```

### Pre-configured Features

**Tools:**
- `FileEditorTool` - Create/edit test files
- `CodeAnalyzer` - Analyze existing test patterns

**Skills:**
- `test_generation` - Convert manual tests to code
- `page_object_pattern` - Generate POM structure
- `best_practices` - Add waits, assertions, error handling

### Customization

```python
from openhands.sdk.tool import Tool

# Add custom code formatter tool
prettier_tool = Tool(name="PrettierFormatter")

agent = CodingAgent(
    llm=llm,
    default_framework="playwright",
    custom_tools=[prettier_tool],
    include_fixtures=True,          # Generate pytest fixtures
    include_page_objects=True,      # Use POM pattern
    add_error_handling=True,        # Wrap in try/catch
)
```

### Implementation

```python
# kiteagent/agents/coding.py
class CodingAgent(Agent):
    """Pre-configured agent for test code generation"""
    
    def __init__(
        self,
        llm,
        default_framework="playwright",
        custom_tools=None,
        custom_skills=None,
        include_fixtures=True,
        include_page_objects=True,
    ):
        # Build skills
        skills = [
            self._create_test_generation_skill(default_framework),
            self._create_code_quality_skill(),
        ]
        
        if custom_skills:
            skills.extend(custom_skills)
        
        # Build tools
        tools = [Tool(name="FileEditorTool")]
        if custom_tools:
            tools.extend(custom_tools)
        
        super().__init__(llm=llm, tools=tools, skills=skills)
        
        self.default_framework = default_framework
        self.include_fixtures = include_fixtures
        self.include_page_objects = include_page_objects
    
    @staticmethod
    def _create_test_generation_skill(framework):
        return Skill(
            name="test_generation",
            trigger=KeywordTrigger(keywords=["generate test", "create test code"]),
            content=f"""
            Generate \{framework\} test code from conversation history:
            
            1. **Extract Actions**: Read BrowserTestObservation events
               - navigate(url) → page.goto(url)
               - click(selector) → page.click(selector)
               - input_text(selector, text) → page.fill(selector, text)
               - extract_content(prompt) → assertion
            
            2. **Structure Code**:
               - Page Object Model classes
               - Test functions with explicit waits
               - Setup/teardown fixtures
               - Assertions from extract results
            
            3. **Best Practices**:
               - Use explicit waits (not sleep)
               - Robust selectors (test IDs > aria > CSS)
               - Error handling with retry
               - Clear test names and comments
            
            4. **Save**: generated/\{test_name\}_test.py
            """
        )

## VisualRegressionAgent

Performs visual testing with baseline comparison.
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
