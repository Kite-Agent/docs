---
sidebar_position: 1
---

# Basic Test Example

Complete example of browser testing with KiteAgent using OpenHands SDK.

## Scenario

Test a login flow:
1. Navigate to login page
2. Enter credentials
3. Submit form
4. Verify successful login

## Setup

```python
from openhands.sdk import Agent, Conversation, LLM
from openhands.sdk.workspace import LocalWorkspace
from openhands.sdk.tool import Tool, register_tool
from openhands.sdk.context.skills import Skill, KeywordTrigger
from openhands.sdk.event import ObservationEvent
```

## Register browser-use Tool

```python
from browser_use import Agent as BrowserUseAgent, Tools

class BrowserUseTool:
    """Direct browser-use integration"""
    
    @classmethod
    def create(cls, conv_state, **params):
        tools = Tools()
        return [\{
            'name': 'browser_automation',
            'description': 'Execute browser automation tasks',
            'tools': tools,
        \}]

register_tool("BrowserAutomation", BrowserUseTool)
```

## Create Testing Agent

```python
# Self-healing skill (optional but recommended)
self_healing = Skill(
    name="self_healing",
    trigger=KeywordTrigger(keywords=["ElementNotFoundException", "selector failed"]),
    content="""
    When selector fails:
    1. Take screenshot
    2. Use browser-use extract to find similar elements
    3. Generate new robust selector
    4. Log change to Conversation
    5. Continue test
    """
)

# Create agent
agent = Agent(
    llm=LLM(
        model="anthropic/claude-sonnet-4",
        temperature=0.0  # Deterministic for production
    ),
    tools=[Tool(name="BrowserAutomation")],
    skills=[self_healing],
)
```

## Execute Test

```python
def test_login():
    """Test login flow"""
    
    with LocalWorkspace("/workspace/tests") as workspace:
        # Create conversation
        conversation = Conversation(
            agent=agent,
            workspace=workspace
        )
        
        # Send test request
        conversation.send_message("""
            Test login flow at https://example.com:
            1. Navigate to login page
            2. Enter username: testuser@example.com
            3. Enter password: SecurePass123!
            4. Click login button
            5. Verify dashboard page appears with 'Welcome' message
        """)
        
        # Execute
        conversation.run()
        
        # Check results
        status = conversation.state.status.value
        
        if status == "success":
            print("✓ Test passed!")
            
            # Extract screenshots
            screenshots = []
            for event in conversation.state.events:
                if hasattr(event, 'screenshots'):
                    screenshots.extend(event.screenshots)
            
            print(f"  Captured \{len(screenshots)\} screenshots")
            
            # Extract browser actions
            for event in conversation.state.events:
                if isinstance(event, ObservationEvent) and hasattr(event, 'history'):
                    print(f"  Executed \{len(event.history)\} browser actions")
            
            return True
        else:
            print("✗ Test failed!")
            
            # Debug failures
            for event in conversation.state.events:
                if isinstance(event, ObservationEvent) and not event.success:
                    print(f"  Failed: \{event.content\}")
            
            return False

# Run test
if __name__ == "__main__":
    success = test_login()
    exit(0 if success else 1)
```

## Complete Working Example

```python
#!/usr/bin/env python3
"""
Complete login test example with KiteAgent
"""
from openhands.sdk import Agent, Conversation, LLM
from openhands.sdk.workspace import LocalWorkspace
from openhands.sdk.tool import Tool, register_tool
from openhands.sdk.context.skills import Skill, KeywordTrigger
from openhands.sdk.event import ObservationEvent
from browser_use import Tools
import os
import json
import base64

# 1. Register browser-use tool
class BrowserUseTool:
    @classmethod
    def create(cls, conv_state, **params):
        return [\{
            'name': 'browser_automation',
            'description': 'Execute browser automation',
            'tools': Tools(),
        \}]

register_tool("BrowserAutomation", BrowserUseTool)

# 2. Define self-healing skill
self_healing = Skill(
    name="self_healing",
    trigger=KeywordTrigger(keywords=["ElementNotFoundException"]),
    content="""
    When selector fails:
    1. Take screenshot
    2. Use extract to find similar elements
    3. Generate new robust selector
    4. Continue test
    """
)

# 3. Create agent
agent = Agent(
    llm=LLM(model="anthropic/claude-sonnet-4", temperature=0.0),
    tools=[Tool(name="BrowserAutomation")],
    skills=[self_healing],
)

# 4. Test function
def test_login(url: str, username: str, password: str):
    """Execute login test"""
    
    print(f"Testing login at \{url\}...")
    
    with LocalWorkspace("/workspace/tests") as workspace:
        conversation = Conversation(agent=agent, workspace=workspace)
        
        # Send test request
        conversation.send_message(f"""
            Test login flow:
            1. Navigate to \{url\}
            2. Enter username: \{username\}
            3. Enter password: \{password\}
            4. Click login/submit button
            5. Verify successful login (dashboard or welcome message)
        """)
        
        # Execute
        conversation.run()
        
        # Collect results
        result = \{
            'status': conversation.state.status.value,
            'total_steps': len(conversation.state.events),
            'screenshots': [],
            'browser_actions': [],
            'failures': []
        \}
        
        # Extract details
        for event in conversation.state.events:
            if isinstance(event, ObservationEvent):
                # Screenshots
                if hasattr(event, 'screenshots'):
                    result['screenshots'].extend(event.screenshots)
                
                # Browser actions
                if hasattr(event, 'history'):
                    result['browser_actions'].extend(event.history)
                
                # Failures
                if not event.success:
                    result['failures'].append(\{
                        'step': len(result['failures']) + 1,
                        'error': event.content
                    \})
        
        # Print summary
        print(f"\nTest Results:")
        print(f"  Status: \{result['status']\}")
        print(f"  Total Steps: \{result['total_steps']\}")
        print(f"  Screenshots: \{len(result['screenshots'])\}")
        print(f"  Browser Actions: \{len(result['browser_actions'])\}")
        print(f"  Failures: \{len(result['failures'])\}")
        
        if result['failures']:
            print(f"\nFailures:")
            for failure in result['failures']:
                print(f"  \{failure['step']\}. \{failure['error']\}")
        
        # Save artifacts
        os.makedirs("test-results", exist_ok=True)
        
        # Save test report
        with open("test-results/login_test.json", "w") as f:
            json.dump(\{
                'status': result['status'],
                'total_steps': result['total_steps'],
                'screenshot_count': len(result['screenshots']),
                'action_count': len(result['browser_actions']),
                'failures': result['failures']
            \}, f, indent=2)
        
        # Save screenshots
        for i, screenshot in enumerate(result['screenshots']):
            with open(f"test-results/screenshot_\{i\}.png", "wb") as f:
                f.write(base64.b64decode(screenshot))
        
        print(f"\n✓ Test artifacts saved to test-results/")
        
        return result['status'] == "success"

# 5. Run test
if __name__ == "__main__":
    import sys
    
    # Configuration
    TEST_URL = os.getenv("TEST_URL", "https://example.com/login")
    TEST_USERNAME = os.getenv("TEST_USERNAME", "testuser@example.com")
    TEST_PASSWORD = os.getenv("TEST_PASSWORD", "SecurePass123!")
    
    # Execute
    success = test_login(TEST_URL, TEST_USERNAME, TEST_PASSWORD)
    
    # Exit code for CI/CD
    sys.exit(0 if success else 1)
```

## Running the Test

```bash
# Install dependencies
pip install openhands-sdk browser-use anthropic

# Set API key
export ANTHROPIC_API_KEY="your-api-key"

# Optional: Configure test
export TEST_URL="https://example.com/login"
export TEST_USERNAME="testuser@example.com"
export TEST_PASSWORD="SecurePass123!"

# Run test
python test_login.py
```

## Expected Output

```
Testing login at https://example.com/login...

Test Results:
  Status: success
  Total Steps: 12
  Screenshots: 3
  Browser Actions: 8
  Failures: 0

✓ Test artifacts saved to test-results/
```

## Test Artifacts

After execution, you'll have:

```
test-results/
├── login_test.json       # Test results summary
├── screenshot_0.png      # Login page
├── screenshot_1.png      # After form fill
└── screenshot_2.png      # Dashboard
```

## Variations

### With Multiple Assertions

```python
conversation.send_message("""
    Test login flow:
    1. Navigate to https://example.com/login
    2. Enter username: testuser@example.com
    3. Enter password: SecurePass123!
    4. Click login button
    5. Verify URL changed to /dashboard
    6. Verify 'Welcome, testuser' text is visible
    7. Verify logout button is present
    8. Take screenshot of dashboard
""")
```

### With Error Cases

```python
def test_invalid_login():
    """Test with invalid credentials"""
    
    with LocalWorkspace("/workspace/tests") as workspace:
        conversation = Conversation(agent=agent, workspace=workspace)
        
        conversation.send_message("""
            Test invalid login:
            1. Navigate to https://example.com/login
            2. Enter username: invalid@example.com
            3. Enter password: wrongpassword
            4. Click login button
            5. Verify error message appears: 'Invalid credentials'
            6. Verify still on login page
        """)
        
        conversation.run()
        
        return conversation.state.status.value == "success"
```

### With Test Data

```python
test_cases = [
    \{
        "name": "Valid login",
        "username": "testuser@example.com",
        "password": "SecurePass123!",
        "expect_success": True
    \},
    \{
        "name": "Invalid email",
        "username": "invalid-email",
        "password": "SecurePass123!",
        "expect_success": False
    \},
    \{
        "name": "Wrong password",
        "username": "testuser@example.com",
        "password": "WrongPass",
        "expect_success": False
    \}
]

for case in test_cases:
    print(f"\nRunning: \{case['name']\}")
    success = test_login(
        "https://example.com/login",
        case['username'],
        case['password']
    )
    
    if success == case['expect_success']:
        print(f"✓ \{case['name']\} passed")
    else:
        print(f"✗ \{case['name']\} failed")
```

## Next Steps

- **[Self-Healing Example](/docs/examples/self-healing)** - Automatic recovery from failures
- **[Code Generation Example](/docs/examples/code-generation)** - Generate test code from execution
- **[Guides](/docs/guides/getting-started)** - More testing patterns
