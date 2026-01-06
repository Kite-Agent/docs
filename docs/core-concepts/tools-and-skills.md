---
sidebar_position: 6
---

# Tools & Skills

Extend KiteAgent following OpenHands' tool pattern.

## Tools (External Systems)

### BrowserTool (Browser-use wrapper)

```python
from kiteagent import BrowserTool

tool = BrowserTool(headless=True)

# Browser-use methods
tool.click('#button')
tool.type('input', 'text')
tool.navigate('https://example.com')
tool.extract_content('.result')
```

### Custom Tool

```python
from kiteagent import Tool

class APITool(Tool):
    name = 'api'

    def execute(self, action):
        response = requests.request(
            action.method,
            action.url,
            json=action.data
        )
        return APIResponseEvent(response)

# Use
agent = BrowsingAgent(tools=[
    BrowserTool(),
    APITool()
])
```

## Skills (Intelligent Behaviors)

### SelfHealingSkill

```python
from kiteagent import SelfHealingSkill

skill = SelfHealingSkill(
    vision_model='gpt-4-vision',
    max_retries=3
)

# Auto-activates on ElementNotFoundException
agent = BrowsingAgent(
    tools=[BrowserTool()],
    skills=[skill]
)
```

**How it works:**

1. Selector fails
2. Takes screenshot
3. Uses vision model to find element
4. Returns new selector
5. Retries automatically

### VisualCheckSkill

```python
from kiteagent import VisualCheckSkill

skill = VisualCheckSkill(threshold=0.95)

result = skill.compare(
    reference_screenshot,
    current_screenshot
)
# Returns: similarity, passed, diff_image
```

### Custom Skill

```python
from kiteagent import Skill

class LoadTestSkill(Skill):
    name = 'load_test'

    def can_handle(self, error):
        return isinstance(error, PerformanceError)

    def recover(self, conversation, error):
        # Generate k6 script from conversation
        script = self.conversation_to_k6(conversation)
        # Run load test
        return self.run_k6(script)
```

## Tool vs Skill

- **Tool** = "What" (interact with system)
- **Skill** = "How" (intelligent recovery/behavior)

```python
agent = BrowsingAgent(
    tools=[
        BrowserTool(),  # What: browser actions
        APITool()       # What: API calls
    ],
    skills=[
        SelfHealingSkill(),  # How: recover from failures
        VisualCheckSkill()   # How: compare screenshots
    ]
)
```

## Next Steps

- **[Guides: Tools](../guides/tools)** - Create custom tools
- **[Examples: Self-Healing](../examples/self-healing)** - See skills in action
