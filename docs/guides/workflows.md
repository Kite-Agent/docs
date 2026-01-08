---
sidebar_position: 5
---

# Complex Workflows

Build sophisticated multi-agent testing workflows with LangGraph orchestration.

## Multi-Agent Architecture

```python
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres import PostgresSaver
from typing import TypedDict, Annotated
from langgraph.graph import add_messages
from openhands.sdk import Agent, Conversation, LLM
from openhands.sdk.workspace import LocalWorkspace
from openhands.sdk.tool import Tool

# Define workflow state
class TestWorkflowState(TypedDict):
    messages: Annotated[list, add_messages]
    test_result: dict | None
    code_path: str | None
    validation_status: str | None

# Setup agents
browser_agent = Agent(
    llm=LLM(model="anthropic/claude-sonnet-4"),
    tools=[Tool(name="BrowserAutomation")],
    skills=[self_healing_skill]
)

code_agent = Agent(
    llm=LLM(model="anthropic/claude-sonnet-4"),
    tools=[Tool(name="FileEditorTool")],
    skills=[test_generation_skill]
)

validation_agent = Agent(
    llm=LLM(model="anthropic/claude-sonnet-4"),
    tools=[Tool(name="FileEditorTool")],
)
```

## Complete Workflow Example

### Test → Generate → Validate

```python
def browser_test_node(state: TestWorkflowState):
    """Execute browser test"""
    user_msg = state["messages"][-1]["content"]
    
    with LocalWorkspace("/workspace/tests") as ws:
        conv = Conversation(browser_agent, ws)
        conv.send_message(user_msg)
        conv.run()
        
        # Extract results
        screenshots = []
        for event in conv.state.events:
            if hasattr(event, 'screenshots'):
                screenshots.extend(event.screenshots)
        
        return \{
            "test_result": \{
                "status": conv.state.status.value,
                "events": [e.to_dict() for e in conv.state.events],
                "screenshots": len(screenshots)
            \}
        \}

def code_generation_node(state: TestWorkflowState):
    """Generate test code"""
    test_result = state["test_result"]
    
    with LocalWorkspace("/workspace/tests") as ws:
        conv = Conversation(code_agent, ws)
        conv.send_message(f"Generate Playwright test from execution: \{test_result\}")
        conv.run()
        
        # Find generated file path
        code_path = None
        for event in conv.state.events:
            if hasattr(event, 'result') and 'generated/' in str(event.result):
                code_path = event.result
                break
        
        return \{"code_path": code_path or "generated/test.py"\}

def validation_node(state: TestWorkflowState):
    """Validate generated code"""
    code_path = state["code_path"]
    
    with LocalWorkspace("/workspace/tests") as ws:
        conv = Conversation(validation_agent, ws)
        conv.send_message(f"""
            Validate generated test at \{code_path\}:
            1. Check syntax
            2. Verify assertions
            3. Ensure Page Object Model pattern
            4. Add missing error handling
        """)
        conv.run()
        
        return \{
            "validation_status": "passed" if conv.state.status.value == "success" else "failed"
        \}

# Build workflow
workflow = StateGraph(TestWorkflowState)

# Add nodes
workflow.add_node("browser_test", browser_test_node)
workflow.add_node("code_generation", code_generation_node)
workflow.add_node("validation", validation_node)

# Define flow
workflow.set_entry_point("browser_test")
workflow.add_edge("browser_test", "code_generation")
workflow.add_edge("code_generation", "validation")
workflow.add_edge("validation", END)

# Compile with persistence
checkpointer = PostgresSaver.from_conn_string("postgresql://localhost/kite_tests")
graph = workflow.compile(checkpointer=checkpointer)

# Execute workflow
result = graph.invoke(
    \{
        "messages": [\{
            "role": "user",
            "content": "Test login flow at https://example.com and generate Playwright code"
        \}]
    \},
    config=\{"configurable": \{"thread_id": "workflow-001"\}\}
)

print(f"Test: \{result['test_result']['status']\}")
print(f"Code: \{result['code_path']\}")
print(f"Validation: \{result['validation_status']\}")
```

## Conditional Workflows

### Dynamic Routing

```python
def supervisor_node(state: TestWorkflowState):
    """Route based on user request"""
    user_msg = state["messages"][-1]["content"].lower()
    
    if "api" in user_msg:
        return "api_test"
    elif "performance" in user_msg or "load" in user_msg:
        return "perf_test"
    elif "generate" in user_msg:
        return "code_generation"
    else:
        return "browser_test"

# API testing node
def api_test_node(state):
    with LocalWorkspace("/workspace") as ws:
        conv = Conversation(api_agent, ws)
        conv.send_message(state["messages"][-1]["content"])
        conv.run()
        
        return \{"test_result": \{"status": conv.state.status.value\}\}

# Performance testing node
def perf_test_node(state):
    with LocalWorkspace("/workspace") as ws:
        conv = Conversation(perf_agent, ws)
        conv.send_message(state["messages"][-1]["content"])
        conv.run()
        
        return \{"test_result": \{"status": conv.state.status.value\}\}

# Build workflow with routing
workflow = StateGraph(TestWorkflowState)
workflow.add_node("supervisor", supervisor_node)
workflow.add_node("browser_test", browser_test_node)
workflow.add_node("api_test", api_test_node)
workflow.add_node("perf_test", perf_test_node)
workflow.add_node("code_generation", code_generation_node)

# Add conditional edges
workflow.set_entry_point("supervisor")
workflow.add_conditional_edges("supervisor", supervisor_node)
workflow.add_edge("browser_test", "code_generation")
workflow.add_edge("api_test", "code_generation")
workflow.add_edge("perf_test", END)
workflow.add_edge("code_generation", END)
```

### Error Handling and Retry

```python
def browser_test_with_retry(state: TestWorkflowState):
    """Execute browser test with automatic retry"""
    max_retries = 3
    attempt = 0
    
    while attempt < max_retries:
        with LocalWorkspace("/workspace/tests") as ws:
            conv = Conversation(browser_agent, ws)
            conv.send_message(state["messages"][-1]["content"])
            conv.run()
            
            if conv.state.status.value == "success":
                return \{
                    "test_result": \{
                        "status": "success",
                        "attempts": attempt + 1,
                        "events": [e.to_dict() for e in conv.state.events]
                    \}
                \}
            
            attempt += 1
            print(f"Attempt \{attempt\} failed, retrying...")
    
    return \{
        "test_result": \{
            "status": "failed",
            "attempts": max_retries,
            "error": "Max retries exceeded"
        \}
    \}

def check_test_success(state: TestWorkflowState):
    """Route based on test result"""
    if state["test_result"]["status"] == "success":
        return "code_generation"
    else:
        return "failure_handler"

def failure_handler_node(state: TestWorkflowState):
    """Handle test failures"""
    return \{
        "validation_status": f"failed after \{state['test_result']['attempts']\} attempts"
    \}

# Build workflow
workflow.add_node("browser_test", browser_test_with_retry)
workflow.add_node("code_generation", code_generation_node)
workflow.add_node("failure_handler", failure_handler_node)

workflow.set_entry_point("browser_test")
workflow.add_conditional_edges("browser_test", check_test_success)
workflow.add_edge("code_generation", END)
workflow.add_edge("failure_handler", END)
```

## Parallel Execution

### Run Multiple Tests Concurrently

```python
from concurrent.futures import ThreadPoolExecutor
import asyncio

def parallel_test_node(state: TestWorkflowState):
    """Execute multiple tests in parallel"""
    
    test_scenarios = [
        "Test login flow",
        "Test registration flow",
        "Test password reset flow",
        "Test profile update flow"
    ]
    
    def run_single_test(scenario):
        with LocalWorkspace("/workspace/tests") as ws:
            conv = Conversation(browser_agent, ws)
            conv.send_message(scenario)
            conv.run()
            
            return \{
                "scenario": scenario,
                "status": conv.state.status.value,
                "events": len(conv.state.events)
            \}
    
    # Execute in parallel
    with ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(run_single_test, test_scenarios))
    
    # Aggregate results
    total_tests = len(results)
    passed = sum(1 for r in results if r["status"] == "success")
    
    return \{
        "test_result": \{
            "total": total_tests,
            "passed": passed,
            "failed": total_tests - passed,
            "details": results
        \}
    \}

# Use in workflow
workflow.add_node("parallel_tests", parallel_test_node)
workflow.set_entry_point("parallel_tests")
workflow.add_edge("parallel_tests", END)

# Execute
result = graph.invoke(
    \{"messages": [\{"role": "user", "content": "Run all authentication tests"\}]\},
    config=\{"configurable": \{"thread_id": "parallel-001"\}\}
)

print(f"Passed: \{result['test_result']['passed']\}/\{result['test_result']['total']\}")
```

## Session Management

### Resume Workflow

```python
# Start workflow
result1 = graph.invoke(
    \{"messages": [\{"role": "user", "content": "Test login"\}]\},
    config=\{"configurable": \{"thread_id": "session-123"\}\}
)

# Later: Resume same workflow
result2 = graph.invoke(
    \{"messages": [\{"role": "user", "content": "Now test logout"\}]\},
    config=\{"configurable": \{"thread_id": "session-123"\}\}  # Same thread_id
)

# Workflow continues from last checkpoint
```

### Query Session History

```python
from langgraph.checkpoint.postgres import PostgresSaver

checkpointer = PostgresSaver.from_conn_string("postgresql://localhost/kite_tests")

# Get all checkpoints for a thread
history = checkpointer.list(
    config=\{"configurable": \{"thread_id": "session-123"\}\}
)

for checkpoint in history:
    print(f"Step: \{checkpoint['id']\}")
    print(f"State: \{checkpoint['state']\}")
```

## Advanced Patterns

### Pattern 1: Test Suite Execution

```python
def test_suite_workflow():
    """Execute complete test suite with reporting"""
    
    def setup_node(state):
        """Setup test environment"""
        with LocalWorkspace("/workspace") as ws:
            conv = Conversation(setup_agent, ws)
            conv.send_message("Setup test database and seed data")
            conv.run()
            return \{"setup_complete": True\}
    
    def smoke_tests_node(state):
        """Run smoke tests"""
        tests = ["Test homepage", "Test login", "Test navigation"]
        results = []
        
        for test in tests:
            with LocalWorkspace("/workspace") as ws:
                conv = Conversation(browser_agent, ws)
                conv.send_message(test)
                conv.run()
                results.append(conv.state.status.value == "success")
        
        return \{"smoke_passed": all(results)\}
    
    def regression_tests_node(state):
        """Run regression tests (only if smoke passed)"""
        if not state.get("smoke_passed"):
            return \{"regression_status": "skipped"\}
        
        # Run extensive tests
        with LocalWorkspace("/workspace") as ws:
            conv = Conversation(browser_agent, ws)
            conv.send_message("Execute all regression tests")
            conv.run()
            
            return \{"regression_status": conv.state.status.value\}
    
    def report_node(state):
        """Generate test report"""
        with LocalWorkspace("/workspace") as ws:
            conv = Conversation(report_agent, ws)
            conv.send_message(f"Generate HTML report from: \{state\}")
            conv.run()
            
            return \{"report_path": "reports/test_suite.html"\}
    
    # Build suite workflow
    workflow = StateGraph(TestWorkflowState)
    workflow.add_node("setup", setup_node)
    workflow.add_node("smoke_tests", smoke_tests_node)
    workflow.add_node("regression_tests", regression_tests_node)
    workflow.add_node("report", report_node)
    
    workflow.set_entry_point("setup")
    workflow.add_edge("setup", "smoke_tests")
    workflow.add_edge("smoke_tests", "regression_tests")
    workflow.add_edge("regression_tests", "report")
    workflow.add_edge("report", END)
    
    return workflow.compile(checkpointer=checkpointer)

# Execute suite
suite = test_suite_workflow()
result = suite.invoke(
    \{"messages": [\{"role": "user", "content": "Run full test suite"\}]\},
    config=\{"configurable": \{"thread_id": "suite-001"\}\}
)
```

### Pattern 2: Visual Regression Pipeline

```python
def visual_regression_workflow():
    """Visual regression testing pipeline"""
    
    def capture_baseline_node(state):
        """Capture baseline screenshots"""
        with LocalWorkspace("/workspace") as ws:
            conv = Conversation(browser_agent, ws)
            conv.send_message("""
                Navigate through all pages and capture baseline screenshots:
                - Homepage
                - Products page
                - Checkout page
                - Profile page
            """)
            conv.run()
            
            return \{"baseline_captured": True\}
    
    def capture_current_node(state):
        """Capture current screenshots"""
        with LocalWorkspace("/workspace") as ws:
            conv = Conversation(browser_agent, ws)
            conv.send_message("Capture current screenshots of all pages")
            conv.run()
            
            return \{"current_captured": True\}
    
    def compare_node(state):
        """Compare screenshots"""
        with LocalWorkspace("/workspace") as ws:
            conv = Conversation(visual_agent, ws)
            conv.send_message("""
                Compare baseline and current screenshots.
                Generate diff images for any differences > 5%
            """)
            conv.run()
            
            # Parse comparison results
            diffs = []
            for event in conv.state.events:
                if hasattr(event, 'result') and 'difference' in str(event.result):
                    diffs.append(event.result)
            
            return \{
                "visual_diffs": diffs,
                "regression_found": len(diffs) > 0
            \}
    
    def report_diffs_node(state):
        """Generate visual regression report"""
        with LocalWorkspace("/workspace") as ws:
            conv = Conversation(report_agent, ws)
            conv.send_message(f"Create visual regression report: \{state['visual_diffs']\}")
            conv.run()
            
            return \{"report_path": "reports/visual_regression.html"\}
    
    # Build workflow
    workflow = StateGraph(TestWorkflowState)
    workflow.add_node("capture_baseline", capture_baseline_node)
    workflow.add_node("capture_current", capture_current_node)
    workflow.add_node("compare", compare_node)
    workflow.add_node("report", report_diffs_node)
    
    workflow.set_entry_point("capture_baseline")
    workflow.add_edge("capture_baseline", "capture_current")
    workflow.add_edge("capture_current", "compare")
    workflow.add_edge("compare", "report")
    workflow.add_edge("report", END)
    
    return workflow.compile(checkpointer=checkpointer)
```

### Pattern 3: Data-Driven Test Workflow

```python
def data_driven_workflow(test_data):
    """Execute data-driven tests"""
    
    def load_test_data_node(state):
        """Load test data"""
        return \{"test_cases": test_data\}
    
    def execute_tests_node(state):
        """Execute all test cases"""
        results = []
        
        for case in state["test_cases"]:
            with LocalWorkspace("/workspace") as ws:
                conv = Conversation(browser_agent, ws)
                conv.send_message(f"""
                    Test login with:
                    - Username: \{case['username']\}
                    - Password: \{case['password']\}
                    - Expected: \{case['expected_result']\}
                """)
                conv.run()
                
                actual = conv.state.status.value
                passed = (actual == "success") == (case['expected_result'] == "success")
                
                results.append(\{
                    "case": case,
                    "actual": actual,
                    "passed": passed
                \})
        
        return \{"test_results": results\}
    
    def generate_report_node(state):
        """Generate data-driven test report"""
        results = state["test_results"]
        total = len(results)
        passed = sum(1 for r in results if r["passed"])
        
        return \{
            "report": \{
                "total": total,
                "passed": passed,
                "failed": total - passed,
                "details": results
            \}
        \}
    
    # Build workflow
    workflow = StateGraph(TestWorkflowState)
    workflow.add_node("load_data", load_test_data_node)
    workflow.add_node("execute", execute_tests_node)
    workflow.add_node("report", generate_report_node)
    
    workflow.set_entry_point("load_data")
    workflow.add_edge("load_data", "execute")
    workflow.add_edge("execute", "report")
    workflow.add_edge("report", END)
    
    return workflow.compile(checkpointer=checkpointer)

# Execute with test data
test_data = [
    \{"username": "valid@test.com", "password": "correct", "expected_result": "success"\},
    \{"username": "invalid@test.com", "password": "wrong", "expected_result": "failure"\},
    \{"username": "locked@test.com", "password": "correct", "expected_result": "locked"\},
]

workflow = data_driven_workflow(test_data)
result = workflow.invoke(
    \{"messages": [\{"role": "user", "content": "Execute data-driven tests"\}]\},
    config=\{"configurable": \{"thread_id": "data-driven-001"\}\}
)

print(f"Results: \{result['report']\}")
```

## Next Steps

- **[Agents](/docs/guides/agents)** - Configure agents for workflows
- **[Tools](/docs/guides/tools)** - Create workflow-specific tools
- **[Examples](/docs/examples/basic-test)** - Complete workflow examples
