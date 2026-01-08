# Basics

> Tools are the functions that the agent has to interact with the world.

## Quick Example

```python  theme={null}
from browser_use import Tools, ActionResult, Browser

tools = Tools()

@tools.action('Ask human for help with a question')
def ask_human(question: str, browser: Browser) -> ActionResult:
    answer = input(f'{question} > ')
    return f'The human responded with: {answer}'

agent = Agent(
    task='Ask human for help',
    llm=llm,
    tools=tools,
)
```

<Note>
  Use `browser` parameter in tools for deterministic [Actor](/customize/actor/basics) actions.
</Note>


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.browser-use.com/llms.txt

# Available Tools

> Here is the [source code](https://github.com/browser-use/browser-use/blob/main/browser_use/tools/service.py) for the default tools:

### Navigation & Browser Control

* **`search`** - Search queries (DuckDuckGo, Google, Bing)
* **`navigate`** - Navigate to URLs
* **`go_back`** - Go back in browser history
* **`wait`** - Wait for specified seconds

### Page Interaction

* **`click`** - Click elements by their index
* **`input`** - Input text into form fields
* **`upload_file`** - Upload files to file inputs
* **`scroll`** - Scroll the page up/down
* **`find_text`** - Scroll to specific text on page
* **`send_keys`** - Send special keys (Enter, Escape, etc.)

### JavaScript Execution

* **`evaluate`** - Execute custom JavaScript code on the page (for advanced interactions, shadow DOM, custom selectors, data extraction)

### Tab Management

* **`switch`** - Switch between browser tabs
* **`close`** - Close browser tabs

### Content Extraction

* **`extract`** - Extract data from webpages using LLM

### Visual Analysis

* **`screenshot`** - Request a screenshot in your next browser state for visual confirmation

### Form Controls

* **`dropdown_options`** - Get dropdown option values
* **`select_dropdown`** - Select dropdown options

### File Operations

* **`write_file`** - Write content to files
* **`read_file`** - Read file contents
* **`replace_file`** - Replace text in files

### Task Completion

* **`done`** - Complete the task (always available)


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.browser-use.com/llms.txt


# Add Tools

Examples:

* deterministic clicks
* file handling
* calling APIs
* human-in-the-loop
* browser interactions
* calling LLMs
* get 2fa codes
* send emails
* Playwright integration (see [GitHub example](https://github.com/browser-use/browser-use/blob/main/examples/browser/playwright_integration.py))
* ...

Simply add `@tools.action(...)` to your function.

```python  theme={null}
from browser_use import Tools, Agent

tools = Tools()

@tools.action(description='Ask human for help with a question')
def ask_human(question: str) -> ActionResult:
    answer = input(f'{question} > ')
    return f'The human responded with: {answer}'
```

```python  theme={null}
agent = Agent(task='...', llm=llm, tools=tools)
```

* **`description`** *(required)* - What the tool does, the LLM uses this to decide when to call it.
* **`allowed_domains`** - List of domains where tool can run (e.g. `['*.example.com']`), defaults to all domains

The Agent fills your function parameters based on their names, type hints, & defaults.

## Available Objects

Your function has access to these objects:

* **`browser_session: BrowserSession`** - Current browser session for CDP access
* **`cdp_client`** - Direct Chrome DevTools Protocol client
* **`page_extraction_llm: BaseChatModel`** - The LLM you pass into agent. This can be used to do a custom llm call here.
* **`file_system: FileSystem`** - File system access
* **`available_file_paths: list[str]`** - Available files for upload/processing
* **`has_sensitive_data: bool`** - Whether action contains sensitive data

## Browser Interaction Examples

You can use `browser_session` to directly interact with page elements using CSS selectors:

```python  theme={null}
from browser_use import Tools, Agent, ActionResult, BrowserSession

tools = Tools()

@tools.action(description='Click the submit button using CSS selector')
async def click_submit_button(browser_session: BrowserSession):
    # Get the current page
    page = await browser_session.must_get_current_page()

    # Get element(s) by CSS selector
    elements = await page.get_elements_by_css_selector('button[type="submit"]')

    if not elements:
        return ActionResult(extracted_content='No submit button found')

    # Click the first matching element
    await elements[0].click()

    return ActionResult(extracted_content='Submit button clicked!')
```

Available methods on `Page`:

* `get_elements_by_css_selector(selector: str)` - Returns list of matching elements
* `get_element_by_prompt(prompt: str, llm)` - Returns element or None using LLM
* `must_get_element_by_prompt(prompt: str, llm)` - Returns element or raises error

Available methods on `Element`:

* `click()` - Click the element
* `type(text: str)` - Type text into the element
* `get_text()` - Get element text content
* See `browser_use/actor/element.py` for more methods

## Pydantic Input

You can use Pydantic for the tool parameters:

```python  theme={null}
from pydantic import BaseModel

class Cars(BaseModel):
    name: str = Field(description='The name of the car, e.g. "Toyota Camry"')
    price: int = Field(description='The price of the car as int in USD, e.g. 25000')

@tools.action(description='Save cars to file')
def save_cars(cars: list[Cars]) -> str:
    with open('cars.json', 'w') as f:
        json.dump(cars, f)
    return f'Saved {len(cars)} cars to file'

task = "find cars and save them to file"
```

## Domain Restrictions

Limit tools to specific domains:

```python  theme={null}
@tools.action(
    description='Fill out banking forms',
    allowed_domains=['https://mybank.com']
)
def fill_bank_form(account_number: str) -> str:
    # Only works on mybank.com
    return f'Filled form for account {account_number}'
```

## Advanced Example

For a comprehensive example of custom tools with Playwright integration, see:
**[Playwright Integration Example](https://github.com/browser-use/browser-use/blob/main/examples/browser/playwright_integration.py)**

This shows how to create custom actions that use Playwright's precise browser automation alongside Browser-Use.


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.browser-use.com/llms.txt

# Remove Tools

> You can exclude default tools:

```python  theme={null}
from browser_use import Tools

tools = Tools(exclude_actions=['search', 'wait'])
agent = Agent(task='...', llm=llm, tools=tools)
```


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.browser-use.com/llms.txt


# Tool Response

Tools return results using `ActionResult` or simple strings.

## Return Types

```python  theme={null}
@tools.action('My tool')
def my_tool() -> str:
    return "Task completed successfully"

@tools.action('Advanced tool')
def advanced_tool() -> ActionResult:
    return ActionResult(
        extracted_content="Main result",
        long_term_memory="Remember this info",
        error="Something went wrong",
        is_done=True,
        success=True,
        attachments=["file.pdf"],
    )
```

## ActionResult Properties

* `extracted_content` (default: `None`) - Main result passed to LLM, this is equivalent to returning a string.
* `include_extracted_content_only_once` (default: `False`) - Set to `True` for large content to include it only once in the LLM input.
* `long_term_memory` (default: `None`) - This is always included in the LLM input for all future steps.
* `error` (default: `None`) - Error message, we catch exceptions and set this automatically. This is always included in the LLM input.
* `is_done` (default: `False`) - Tool completes entire task
* `success` (default: `None`) - Task success (only valid with `is_done=True`)
* `attachments` (default: `None`) - Files to show user
* `metadata` (default: `None`) - Debug/observability data

## Why `extracted_content` and `long_term_memory`?

With this you control the context for the LLM.

### 1. Include short content always in context

```python  theme={null}
def simple_tool() -> str:
    return "Hello, world!"  # Keep in context for all future steps 
```

### 2. Show long content once, remember subset in context

```python  theme={null}
return ActionResult(
    extracted_content="[500 lines of product data...]",     # Shows to LLM once
    include_extracted_content_only_once=True,               # Never show full output again
    long_term_memory="Found 50 products"        # Only this in future steps
)
```

We save the full `extracted_content` to files which the LLM can read in future steps.

### 3. Dont show long content, remember subset in context

```python  theme={null}
return ActionResult(
    extracted_content="[500 lines of product data...]",      # The LLM never sees this because `long_term_memory` overrides it and `include_extracted_content_only_once` is not used
    long_term_memory="Saved user's favorite products",      # This is shown to the LLM in future steps
)
```

## Terminating the Agent

Set `is_done=True` to stop the agent completely. Use when your tool finishes the entire task:

```python  theme={null}
@tools.action(description='Complete the task')
def finish_task() -> ActionResult:
    return ActionResult(
        extracted_content="Task completed!",
        is_done=True,        # Stops the agent
        success=True         # Task succeeded 
    )
```


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.browser-use.com/llms.txt