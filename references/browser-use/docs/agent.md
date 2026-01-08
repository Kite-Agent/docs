# Basics

```python  theme={null}
from browser_use import Agent, ChatBrowserUse

agent = Agent(
    task="Search for latest news about AI",
    llm=ChatBrowserUse(),
)

async def main():
    history = await agent.run(max_steps=100)
```

* `task`: The task you want to automate.
* `llm`: Your favorite LLM. See <a href="/supported-models">Supported Models</a>.

The agent is executed using the async `run()` method:

* `max_steps` (default: `100`): Maximum number of steps an agent can take.

Check out all customizable parameters <a href="/customize/agent/all-parameters"> here</a>.


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.browser-use.com/llms.txt

# Prompting Guide

> Tips and tricks 

Prompting can drastically improve performance and solve existing limitations of the library.

### 1. Be Specific vs Open-Ended

**✅ Specific (Recommended)**

```python  theme={null}
task = """
1. Go to https://quotes.toscrape.com/
2. Use extract action with the query "first 3 quotes with their authors"
3. Save results to quotes.csv using write_file action
4. Do a google search for the first quote and find when it was written
"""
```

**❌ Open-Ended**

```python  theme={null}
task = "Go to web and make money"
```

### 2. Name Actions Directly

When you know exactly what the agent should do, reference actions by name:

```python  theme={null}
task = """
1. Use search action to find "Python tutorials"
2. Use click to open first result in a new tab
3. Use scroll action to scroll down 2 pages
4. Use extract to extract the names of the first 5 items
5. Wait for 2 seconds if the page is not loaded, refresh it and wait 10 sec
6. Use send_keys action with "Tab Tab ArrowDown Enter"
"""
```

See [Available Tools](/customize/tools/available) for the complete list of actions.

### 3. Handle interaction problems via keyboard navigation

Sometimes buttons can't be clicked (you found a bug in the library - open an issue).
Good news - often you can work around it with keyboard navigation!

```python  theme={null}
task = """
If the submit button cannot be clicked:
1. Use send_keys action with "Tab Tab Enter" to navigate and activate
2. Or use send_keys with "ArrowDown ArrowDown Enter" for form submission
"""
```

### 4. Custom Actions Integration

```python  theme={null}
# When you have custom actions
@controller.action("Get 2FA code from authenticator app")
async def get_2fa_code():
    # Your implementation
    pass

task = """
Login with 2FA:
1. Enter username/password
2. When prompted for 2FA, use get_2fa_code action
3. NEVER try to extract 2FA codes from the page manually
4. ALWAYS use the get_2fa_code action for authentication codes
"""
```

### 5. Error Recovery

```python  theme={null}
task = """
Robust data extraction:
1. Go to openai.com to find their CEO
2. If navigation fails due to anti-bot protection:
   - Use google search to find the CEO
3. If page times out, use go_back and try alternative approach
"""
```

The key to effective prompting is being specific about actions.


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.browser-use.com/llms.txt

# Output Format

## Agent History

The `run()` method returns an `AgentHistoryList` object with the complete execution history:

```python  theme={null}
history = await agent.run()

# Access useful information
history.urls()                    # List of visited URLs
history.screenshot_paths()        # List of screenshot paths  
history.screenshots()             # List of screenshots as base64 strings
history.action_names()            # Names of executed actions
history.extracted_content()       # List of extracted content from all actions
history.errors()                  # List of errors (with None for steps without errors)
history.model_actions()           # All actions with their parameters
history.model_outputs()           # All model outputs from history
history.last_action()             # Last action in history

# Analysis methods
history.final_result()            # Get the final extracted content (last step)
history.is_done()                 # Check if agent completed successfully
history.is_successful()           # Check if agent completed successfully (returns None if not done)
history.has_errors()              # Check if any errors occurred
history.model_thoughts()          # Get the agent's reasoning process (AgentBrain objects)
history.action_results()          # Get all ActionResult objects from history
history.action_history()          # Get truncated action history with essential fields
history.number_of_steps()         # Get the number of steps in the history
history.total_duration_seconds()  # Get total duration of all steps in seconds

# Structured output (when using output_model_schema)
history.structured_output         # Property that returns parsed structured output
```

See all helper methods in the [AgentHistoryList source code](https://github.com/browser-use/browser-use/blob/main/browser_use/agent/views.py#L301).

## Structured Output

For structured output, use the `output_model_schema` parameter with a Pydantic model. [Example](https://github.com/browser-use/browser-use/blob/main/examples/features/custom_output.py).


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.browser-use.com/llms.txt


# Output Format

## Agent History

The `run()` method returns an `AgentHistoryList` object with the complete execution history:

```python  theme={null}
history = await agent.run()

# Access useful information
history.urls()                    # List of visited URLs
history.screenshot_paths()        # List of screenshot paths  
history.screenshots()             # List of screenshots as base64 strings
history.action_names()            # Names of executed actions
history.extracted_content()       # List of extracted content from all actions
history.errors()                  # List of errors (with None for steps without errors)
history.model_actions()           # All actions with their parameters
history.model_outputs()           # All model outputs from history
history.last_action()             # Last action in history

# Analysis methods
history.final_result()            # Get the final extracted content (last step)
history.is_done()                 # Check if agent completed successfully
history.is_successful()           # Check if agent completed successfully (returns None if not done)
history.has_errors()              # Check if any errors occurred
history.model_thoughts()          # Get the agent's reasoning process (AgentBrain objects)
history.action_results()          # Get all ActionResult objects from history
history.action_history()          # Get truncated action history with essential fields
history.number_of_steps()         # Get the number of steps in the history
history.total_duration_seconds()  # Get total duration of all steps in seconds

# Structured output (when using output_model_schema)
history.structured_output         # Property that returns parsed structured output
```

See all helper methods in the [AgentHistoryList source code](https://github.com/browser-use/browser-use/blob/main/browser_use/agent/views.py#L301).

## Structured Output

For structured output, use the `output_model_schema` parameter with a Pydantic model. [Example](https://github.com/browser-use/browser-use/blob/main/examples/features/custom_output.py).


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.browser-use.com/llms.txt