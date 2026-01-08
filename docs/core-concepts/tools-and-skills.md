---
sidebar_position: 6
---

# Tools & Skills

**Tools** connect agents to external systems (browser, files, APIs). **Skills** add testing expertise (self-healing, visual regression). Both use OpenHands patterns.

## Tools

Tools are capabilities agents can use to interact with external systems.

### Browser Automation (browser-use)

KiteAgent uses **browser-use directly** via OpenHands tool registration:

```python
from openhands.sdk.tool import ToolDefinition, register_tool
from browser_use import Agent as BrowserUseAgent, Tools

class BrowserUseTool(ToolDefinition):
    """Direct integration with browser-use"""
    
    @classmethod
    def create(cls, conv_state, **params):
        """Factory method required by OpenHands"""
        from browser_use import Tools
        
        # Create browser-use tools (20+ built-in actions)
        tools = Tools()
        
        # Optional: Add custom browser actions
        @tools.action(description='Extract test data from page')
        async def extract_test_data(prompt: str, browser_session):
            page = await browser_session.must_get_current_page()
            return await page.extract_content(prompt, llm=conv_state.agent.llm)
        
        return [cls(
            name="browser_automation",
            description="Execute browser automation tasks using natural language",
            llm=conv_state.agent.llm,
            tools=tools,
        )]

# Register tool
register_tool("BrowserAutomation", BrowserUseTool)

# Use in agent
from openhands.sdk import Agent
from openhands.sdk.tool import Tool

agent = Agent(
    llm=llm,
    tools=[Tool(name="BrowserAutomation")],
)
```

**Built-in browser-use Actions:**
- `search_google()` - Search and navigate
- `navigate()` - Go to URL
- `click()` - Click elements
- `input_text()` - Type text
- `extract_content()` - Get page data with LLM
- `screenshot()` - Capture screenshot
- `evaluate_javascript()` - Run JS in page
- `upload_file()` - Upload files
- `scroll()` - Scroll page
- `wait()` - Wait for conditions
- ... and more (20+ total)

**Why Direct Integration:**
- ✅ Zero maintenance - browser-use updates automatically
- ✅ Full feature access - all 20+ browser actions
- ✅ Up-to-date - always uses latest version
- ✅ Extensible - add custom actions via `@tools.action()`

### File Operations (Built-in OpenHands)

```python
from openhands.sdk.tool import Tool

# File editor tool (built into OpenHands)
agent = Agent(
    llm=llm,
    tools=[Tool(name="FileEditorTool")],
)

# Agent can now read/write files in workspace
conversation.send_message("Create test file: generated/login_test.py")
conversation.run()
```

### Custom Tool: API Testing

```python
from openhands.sdk.tool import ToolDefinition, register_tool
import requests

class APITestTool(ToolDefinition):
    """Custom tool for API testing"""
    
    @classmethod
    def create(cls, conv_state, **params):
        return [cls(
            name="api_test",
            description="Execute API requests and validate responses",
            llm=conv_state.agent.llm,
        )]
    
    def execute(self, method: str, url: str, **kwargs):
        """Execute API request"""
        response = requests.request(method, url, **kwargs)
        
        return \{
            'status_code': response.status_code,
            'headers': dict(response.headers),
            'body': response.json() if response.headers.get('content-type') == 'application/json' else response.text,
            'duration': response.elapsed.total_seconds()
        \}

# Register
register_tool("APITest", APITestTool)

# Use
api_agent = Agent(
    llm=llm,
    tools=[Tool(name="APITest")],
)

conversation.send_message("Test POST /api/login with username=test, password=secret")
conversation.run()
```

### Custom Tool: Performance Testing

```python
from openhands.sdk.tool import ToolDefinition, register_tool
import subprocess
import json

class K6Tool(ToolDefinition):
    """Integration with k6 load testing"""
    
    @classmethod
    def create(cls, conv_state, **params):
        return [cls(
            name="k6_test",
            description="Execute k6 load tests",
            llm=conv_state.agent.llm,
        )]
    
    def execute(self, script_path: str, vus: int = 10, duration: str = "30s"):
        """Run k6 test"""
        result = subprocess.run(
            ["k6", "run", "--vus", str(vus), "--duration", duration, script_path],
            capture_output=True,
            text=True
        )
        
        # Parse k6 JSON output
        return \{
            'success': result.returncode == 0,
            'output': result.stdout,
            'metrics': self._parse_k6_output(result.stdout)
        \}

# Register
register_tool("K6", K6Tool)

# Use
perf_agent = Agent(
    llm=llm,
    tools=[Tool(name="K6")],
)

conversation.send_message("Run load test: 100 VUs for 5 minutes on /api/users")
conversation.run()
```

## Skills

Skills add intelligent behaviors that activate automatically based on keywords or conditions.

### Skill Types

```python
from openhands.sdk.context.skills import Skill, KeywordTrigger

# Knowledge Skill: Triggered by keywords
self_healing = Skill(
    name="self_healing",
    trigger=KeywordTrigger(keywords=[
        "ElementNotFoundException",
        "selector failed",
        "element not found"
    ]),
    content="""
    When selector fails:
    1. Take screenshot for visual analysis
    2. Use browser-use extract action to find similar elements
    3. Generate new robust selector (prefer test IDs > aria labels > CSS)
    4. Log selector change to Conversation for reporting
    5. Continue test execution with new selector
    """
)

# Repository Skill: Always active
test_conventions = Skill(
    name="test_conventions",
    content="""
    Test Code Standards:
    - Use Page Object Model pattern
    - Add explicit waits, not sleep()
    - Include assertions with clear messages
    - Handle errors with try/except
    - Log all test steps
    """
)
```

### Self-Healing Skill

Automatically fix broken selectors:

```python
from openhands.sdk.context.skills import Skill, KeywordTrigger

self_healing_skill = Skill(
    name="self_healing",
    trigger=KeywordTrigger(keywords=[
        "ElementNotFoundException",
        "selector failed",
        "element not found",
        "StaleElementReferenceException"
    ]),
    content="""
    Self-Healing Selector Recovery:
    
    When a selector fails to find an element:
    
    1. **Capture Context**
       - Take screenshot of current page
       - Extract page structure using browser-use extract action
       - Log failed selector and error message
    
    2. **Find Alternative**
       - Use browser-use extract with prompt: "Find element similar to: \{original_selector\}"
       - Prefer in order:
         a) data-testid attributes
         b) aria-label attributes
         c) text content matching
         d) CSS selector with visible text
         e) XPath as last resort
    
    3. **Validate New Selector**
       - Test new selector finds exactly 1 element
       - Verify element is visible and interactable
       - If multiple matches, refine selector
    
    4. **Log Change**
       - Record: old_selector → new_selector
       - Add to Conversation events for reporting
       - Include screenshot showing found element
    
    5. **Continue Execution**
       - Retry original action with new selector
       - If fails again, try next alternative
       - Max 3 retry attempts before reporting failure
    
    Example:
    Failed: "#submit-button-old"
    Found: "button[data-testid='submit']"
    """
)

# Use in agent
agent = Agent(
    llm=llm,
    tools=[Tool(name="BrowserAutomation")],
    skills=[self_healing_skill],
)
```

### Visual Regression Skill

Compare screenshots:

```python
visual_regression_skill = Skill(
    name="visual_regression",
    trigger=KeywordTrigger(keywords=[
        "screenshot",
        "visual check",
        "UI changed",
        "appearance",
        "layout"
    ]),
    content="""
    Visual Regression Testing:
    
    For visual verification tasks:
    
    1. **Capture Screenshot**
       - Use browser-use screenshot action
       - Target specific element or full page
       - Save to workspace: artifacts/screenshots/\{test_name\}_\{timestamp\}.png
    
    2. **Check for Baseline**
       - Look in workspace: test-data/baselines/\{test_name\}_baseline.png
       - If no baseline exists, save current as baseline and report
    
    3. **Compare Images** (if baseline exists)
       - Use image diff algorithm (pixel-by-pixel comparison)
       - Calculate difference percentage
       - Generate diff image highlighting changes
    
    4. **Evaluate Results**
       - Difference < 1%: PASS (minor anti-aliasing acceptable)
       - Difference 1-5%: WARN (investigate, may be acceptable)
       - Difference > 5%: FAIL (significant UI change)
    
    5. **Report Findings**
       - Log comparison results to Conversation
       - Include: baseline, current, diff images
       - Provide difference percentage and verdict
       - If FAIL, ask user if change is intentional (update baseline)
    
    Workspace Structure:
    - test-data/baselines/: Reference images
    - artifacts/screenshots/: Current test screenshots
    - artifacts/diffs/: Difference visualizations
    """
)

# Use
agent = Agent(
    llm=llm,
    tools=[Tool(name="BrowserAutomation")],
    skills=[visual_regression_skill],
)

conversation.send_message("Take screenshot of login page and compare with baseline")
conversation.run()
```

### Test Code Generation Skill

Convert manual tests to code:

```python
test_generation_skill = Skill(
    name="test_generation",
    trigger=KeywordTrigger(keywords=[
        "generate test",
        "create test code",
        "convert to Playwright",
        "export to Selenium"
    ]),
    content="""
    Test Code Generation:
    
    Generate automated test code from conversation history:
    
    1. **Extract Actions**
       - Find all BrowserTestObservation events
       - Get browser-use action history from each
       - Actions: navigate, click, input_text, extract_content, etc.
    
    2. **Convert to Target Framework**
       
       **Playwright:**
       ```python
       from playwright.sync_api import sync_playwright
       
       def test_\{name\}():
           with sync_playwright() as p:
               browser = p.chromium.launch()
               page = browser.new_page()
               
               # Convert browser-use actions:
               # navigate → page.goto(url)
               # click → page.click(selector)
               # input_text → page.fill(selector, text)
               # extract_content → page.text_content(selector)
               
               browser.close()
       ```
       
       **Selenium:**
       ```python
       from selenium import webdriver
       from selenium.webdriver.common.by import By
       
       def test_\{name\}():
           driver = webdriver.Chrome()
           
           # Convert browser-use actions:
           # navigate → driver.get(url)
           # click → driver.find_element(By.CSS_SELECTOR, selector).click()
           # input_text → driver.find_element(...).send_keys(text)
           
           driver.quit()
       ```
    
    3. **Add Assertions**
       - Find extract_content actions (these are verifications)
       - Convert to assertions:
         browser-use: extract_content("What is the heading?") → "Dashboard"
         Playwright: assert page.text_content("h1") == "Dashboard"
    
    4. **Apply Best Practices**
       - Use Page Object Model pattern
       - Add explicit waits (not sleep)
       - Include setup/teardown
       - Add error handling
       - Use pytest fixtures
    
    5. **Save to Workspace**
       - File path: generated/\{test_name\}_test.py
       - Include imports, fixtures, test function
       - Add comments explaining each step
    
    Example Output Structure:
    ```python
    # generated/login_test.py
    import pytest
    from playwright.sync_api import Page, expect
    
    class LoginPage:
        def __init__(self, page: Page):
            self.page = page
            self.username = page.locator("#username")
            self.password = page.locator("#password")
            self.submit = page.locator("#submit")
        
        def login(self, username: str, password: str):
            self.username.fill(username)
            self.password.fill(password)
            self.submit.click()
    
    def test_login_success(page: Page):
        # Navigate to login page
        page.goto("https://example.com/login")
        
        # Perform login
        login_page = LoginPage(page)
        login_page.login("user@test.com", "password123")
        
        # Verify redirect to dashboard
        expect(page).to_have_url("https://example.com/dashboard")
        expect(page.locator("h1")).to_have_text("Dashboard")
    ```
    """
)

# Use
coding_agent = Agent(
    llm=llm,
    tools=[Tool(name="FileEditorTool")],
    skills=[test_generation_skill],
)

conversation.send_message("Generate Playwright test from previous test execution")
conversation.run()
```

### Custom Skill: API Contract Validation

```python
api_contract_skill = Skill(
    name="api_contract",
    trigger=KeywordTrigger(keywords=[
        "API response",
        "validate schema",
        "contract test"
    ]),
    content="""
    API Contract Validation:
    
    When testing API endpoints:
    
    1. **Schema Validation**
       - Use JSON Schema to validate response structure
       - Check required fields exist
       - Validate data types (string, number, boolean, array, object)
       - Verify enum values if specified
    
    2. **Status Code Verification**
       - Success: 200-299
       - Client Error: 400-499
       - Server Error: 500-599
    
    3. **Headers Validation**
       - Content-Type matches expected
       - Required headers present (Authorization, etc.)
       - CORS headers if cross-origin
    
    4. **Response Time**
       - Log response duration
       - Warn if > 1000ms
       - Fail if > 5000ms
    
    5. **Generate Report**
       - List all validation checks
       - Mark pass/fail for each
       - Include actual vs expected for failures
    """
)
```

## Tool vs Skill

| Aspect | Tool | Skill |
|--------|------|-------|
| **Purpose** | Execute external actions | Provide expertise/guidance |
| **Activation** | Agent decides when needed | Keyword-triggered or always active |
| **Implementation** | Code that interacts with systems | Natural language instructions |
| **Examples** | browser-use, FileTool, API client | Self-healing, visual regression, test generation |
| **Output** | Observation events | Influences agent decisions |

## Integration Pattern

Combine tools and skills for powerful testing:

```python
from openhands.sdk import Agent, LLM
from openhands.sdk.tool import Tool
from openhands.sdk.context.skills import Skill, KeywordTrigger

# Define skills
self_healing = Skill(
    name="self_healing",
    trigger=KeywordTrigger(keywords=["ElementNotFoundException"]),
    content="..."  # Self-healing logic
)

visual_regression = Skill(
    name="visual_regression",
    trigger=KeywordTrigger(keywords=["screenshot", "visual check"]),
    content="..."  # Visual regression logic
)

test_generation = Skill(
    name="test_generation",
    trigger=KeywordTrigger(keywords=["generate test"]),
    content="..."  # Test generation logic
)

# Create agent with tools + skills
testing_agent = Agent(
    llm=LLM(model="anthropic/claude-sonnet-4"),
    tools=[
        Tool(name="BrowserAutomation"),  # browser-use
        Tool(name="FileEditorTool"),     # Built-in
    ],
    skills=[
        self_healing,
        visual_regression,
        test_generation
    ]
)

# Execute test with full capabilities
with LocalWorkspace("/workspace") as ws:
    conv = Conversation(testing_agent, ws)
    
    # Skills activate automatically based on keywords
    conv.send_message("""
        Test login flow at https://example.com:
        1. Login with user@test.com
        2. Take screenshot and compare with baseline
        3. Generate Playwright test code
    """)
    
    conv.run()
    
    # Self-healing: Activates if selector fails
    # Visual regression: Activates on "screenshot" keyword
    # Test generation: Activates on "generate" keyword
```

## Extensibility

### Adding New Tools

```python
from openhands.sdk.tool import ToolDefinition, register_tool

# 1. Define tool class
class MyCustomTool(ToolDefinition):
    @classmethod
    def create(cls, conv_state, **params):
        return [cls(name="my_tool", llm=conv_state.agent.llm)]
    
    def execute(self, **kwargs):
        # Your tool logic
        return result

# 2. Register tool
register_tool("MyTool", MyCustomTool)

# 3. Use in agent
agent = Agent(llm=llm, tools=[Tool(name="MyTool")])
```

### Adding New Skills

```python
from openhands.sdk.context.skills import Skill, KeywordTrigger

# Define skill
my_skill = Skill(
    name="my_skill",
    trigger=KeywordTrigger(keywords=["trigger", "activate"]),
    content="""
    Your skill instructions here.
    The agent will follow these when triggered.
    """
)

# Use in agent
agent = Agent(llm=llm, skills=[my_skill])
```

## Next Steps

- **[Agents](/docs/core-concepts/agents)** - Using tools and skills
- **[Guides: Tools](/docs/guides/tools)** - Tool development
- **[Examples](/docs/examples/basic-test)** - Practical examples
