---
sidebar_position: 4
---

# Creating Custom Tools

Extend KiteAgent by creating custom tools that integrate with external systems.

## Tool Pattern

OpenHands tools follow the **ToolDefinition** pattern:

```python
from openhands.sdk.tool import ToolDefinition, register_tool

class MyCustomTool(ToolDefinition):
    """Custom tool for KiteAgent"""
    
    @classmethod
    def create(cls, conv_state, **params):
        """Factory method - required by OpenHands"""
        return [cls(
            name="my_tool",
            description="What this tool does",
            llm=conv_state.agent.llm,
        )]
    
    def execute(self, **kwargs):
        """Tool logic"""
        # Your implementation
        result = do_something(kwargs)
        
        return \{
            'success': True,
            'result': result
        \}

# Register tool
register_tool("MyTool", MyCustomTool)

# Use in agent
from openhands.sdk import Agent
from openhands.sdk.tool import Tool

agent = Agent(
    llm=llm,
    tools=[Tool(name="MyTool")],
)
```

## Example: API Testing Tool

```python
from openhands.sdk.tool import ToolDefinition, register_tool
import requests
import time

class APITestTool(ToolDefinition):
    """Tool for API testing"""
    
    @classmethod
    def create(cls, conv_state, **params):
        base_url = params.get('base_url', '')
        return [cls(
            name="api_test",
            description="Execute HTTP requests and validate responses",
            llm=conv_state.agent.llm,
            base_url=base_url,
        )]
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.base_url = kwargs.get('base_url', '')
    
    def execute(self, method: str, endpoint: str, **kwargs):
        """Execute API request"""
        url = f"\{self.base_url\}\{endpoint\}"
        
        start_time = time.time()
        response = requests.request(
            method=method,
            url=url,
            json=kwargs.get('json'),
            headers=kwargs.get('headers', \{\}),
            params=kwargs.get('params', \{\}),
        )
        duration = time.time() - start_time
        
        # Parse response
        try:
            body = response.json()
        except:
            body = response.text
        
        return \{
            'success': 200 <= response.status_code < 300,
            'status_code': response.status_code,
            'headers': dict(response.headers),
            'body': body,
            'duration_ms': int(duration * 1000)
        \}

# Register
register_tool("APITest", APITestTool)

# Use
from openhands.sdk import Agent, Conversation, LLM
from openhands.sdk.workspace import LocalWorkspace
from openhands.sdk.tool import Tool

api_agent = Agent(
    llm=LLM(model="anthropic/claude-sonnet-4"),
    tools=[Tool(name="APITest", base_url="https://api.example.com")],
)

with LocalWorkspace("/workspace") as ws:
    conv = Conversation(api_agent, ws)
    conv.send_message("Test POST /users endpoint with name=John, email=john@test.com")
    conv.run()
    
    # Check results
    for event in conv.state.events:
        if hasattr(event, 'result') and 'status_code' in event.result:
            print(f"API Response: \{event.result['status_code']\}")
            print(f"Duration: \{event.result['duration_ms']\}ms")
```

## Example: Database Testing Tool

```python
from openhands.sdk.tool import ToolDefinition, register_tool
import psycopg2

class DatabaseTool(ToolDefinition):
    """Tool for database operations"""
    
    @classmethod
    def create(cls, conv_state, **params):
        return [cls(
            name="database",
            description="Execute database queries and validations",
            llm=conv_state.agent.llm,
            connection_string=params.get('connection_string'),
        )]
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.conn_string = kwargs.get('connection_string')
        self.conn = None
    
    def _connect(self):
        """Lazy connection"""
        if not self.conn:
            self.conn = psycopg2.connect(self.conn_string)
        return self.conn
    
    def execute(self, operation: str, **kwargs):
        """Execute database operation"""
        conn = self._connect()
        cursor = conn.cursor()
        
        try:
            if operation == "query":
                cursor.execute(kwargs['sql'])
                rows = cursor.fetchall()
                columns = [desc[0] for desc in cursor.description]
                
                return \{
                    'success': True,
                    'rows': [dict(zip(columns, row)) for row in rows],
                    'count': len(rows)
                \}
            
            elif operation == "insert":
                cursor.execute(
                    f"INSERT INTO \{kwargs['table']\} (\{', '.join(kwargs['data'].keys())\}) "
                    f"VALUES (\{', '.join(['%s'] * len(kwargs['data']))\})",
                    list(kwargs['data'].values())
                )
                conn.commit()
                
                return \{
                    'success': True,
                    'rows_affected': cursor.rowcount
                \}
            
            elif operation == "delete":
                cursor.execute(
                    f"DELETE FROM \{kwargs['table']\} WHERE \{kwargs['where']\}"
                )
                conn.commit()
                
                return \{
                    'success': True,
                    'rows_affected': cursor.rowcount
                \}
                
        except Exception as e:
            conn.rollback()
            return \{
                'success': False,
                'error': str(e)
            \}
        finally:
            cursor.close()

# Register
register_tool("Database", DatabaseTool)

# Use
db_agent = Agent(
    llm=llm,
    tools=[Tool(
        name="Database",
        connection_string="postgresql://localhost/testdb"
    )],
)

with LocalWorkspace("/workspace") as ws:
    conv = Conversation(db_agent, ws)
    conv.send_message("Query users table where email contains @test.com")
    conv.run()
```

## Example: Performance Testing Tool

```python
from openhands.sdk.tool import ToolDefinition, register_tool
import subprocess
import json
import tempfile

class K6Tool(ToolDefinition):
    """Tool for k6 load testing"""
    
    @classmethod
    def create(cls, conv_state, **params):
        return [cls(
            name="k6_test",
            description="Execute k6 load tests",
            llm=conv_state.agent.llm,
        )]
    
    def execute(self, script: str = None, script_path: str = None, 
                vus: int = 10, duration: str = "30s"):
        """Run k6 test"""
        
        # If script provided, save to temp file
        if script:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
                f.write(script)
                script_path = f.name
        
        # Run k6
        result = subprocess.run(
            [
                "k6", "run",
                "--vus", str(vus),
                "--duration", duration,
                "--out", "json=/tmp/k6_results.json",
                script_path
            ],
            capture_output=True,
            text=True
        )
        
        # Parse results
        metrics = self._parse_results("/tmp/k6_results.json")
        
        return \{
            'success': result.returncode == 0,
            'metrics': metrics,
            'summary': self._generate_summary(metrics)
        \}
    
    def _parse_results(self, results_file):
        """Parse k6 JSON output"""
        metrics = \{
            'http_req_duration': [],
            'http_req_failed': 0,
            'iterations': 0
        \}
        
        with open(results_file) as f:
            for line in f:
                data = json.loads(line)
                if data['type'] == 'Point':
                    if data['metric'] == 'http_req_duration':
                        metrics['http_req_duration'].append(data['data']['value'])
                    elif data['metric'] == 'http_req_failed':
                        metrics['http_req_failed'] += data['data']['value']
                    elif data['metric'] == 'iterations':
                        metrics['iterations'] += 1
        
        return metrics
    
    def _generate_summary(self, metrics):
        """Generate human-readable summary"""
        durations = metrics['http_req_duration']
        avg = sum(durations) / len(durations) if durations else 0
        
        return \{
            'avg_response_time_ms': round(avg, 2),
            'total_requests': len(durations),
            'failed_requests': metrics['http_req_failed'],
            'success_rate': round((1 - metrics['http_req_failed'] / len(durations)) * 100, 2) if durations else 0
        \}

# Register
register_tool("K6", K6Tool)

# Use
perf_agent = Agent(
    llm=llm,
    tools=[Tool(name="K6")],
)

with LocalWorkspace("/workspace") as ws:
    conv = Conversation(perf_agent, ws)
    conv.send_message("""
        Run load test on https://api.example.com/users:
        - 100 virtual users
        - 5 minutes duration
        - GET requests with random user IDs
    """)
    conv.run()
```

## Tool with browser-use Integration

```python
from openhands.sdk.tool import ToolDefinition, register_tool
from browser_use import Tools

class ExtendedBrowserTool(ToolDefinition):
    """Extend browser-use with custom actions"""
    
    @classmethod
    def create(cls, conv_state, **params):
        # Create browser-use tools
        tools = Tools()
        
        # Add custom actions
        @tools.action(description='Extract all product prices from e-commerce page')
        async def extract_prices(browser_session):
            page = await browser_session.must_get_current_page()
            prices = await page.query_selector_all('.product-price')
            return [await p.text_content() for p in prices]
        
        @tools.action(description='Monitor network requests')
        async def monitor_network(pattern: str, browser_session):
            page = await browser_session.must_get_current_page()
            requests = []
            
            def handle_request(request):
                if pattern in request.url:
                    requests.append(\{
                        'url': request.url,
                        'method': request.method,
                        'headers': request.headers
                    \})
            
            page.on('request', handle_request)
            return requests
        
        return [cls(
            name="extended_browser",
            description="Browser automation with custom actions",
            llm=conv_state.agent.llm,
            tools=tools,
        )]

# Register
register_tool("ExtendedBrowser", ExtendedBrowserTool)
```

## Best Practices

### 1. Error Handling

```python
def execute(self, **kwargs):
    try:
        result = do_operation(kwargs)
        return \{
            'success': True,
            'result': result
        \}
    except Exception as e:
        return \{
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        \}
```

### 2. Consistent Return Format

```python
# Always return dict with 'success' field
return \{
    'success': bool,      # Required
    'result': Any,        # On success
    'error': str,         # On failure
    'metadata': dict,     # Optional additional data
\}
```

### 3. Resource Cleanup

```python
class MyTool(ToolDefinition):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.resource = None
    
    def execute(self, **kwargs):
        try:
            self.resource = acquire_resource()
            result = use_resource(self.resource)
            return \{'success': True, 'result': result\}
        finally:
            if self.resource:
                self.resource.close()
```

### 4. Timeout Handling

```python
import signal

def execute(self, timeout: int = 30, **kwargs):
    """Execute with timeout"""
    
    def timeout_handler(signum, frame):
        raise TimeoutError(f"Operation exceeded \{timeout\}s")
    
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(timeout)
    
    try:
        result = long_running_operation(kwargs)
        return \{'success': True, 'result': result\}
    except TimeoutError as e:
        return \{'success': False, 'error': str(e)\}
    finally:
        signal.alarm(0)  # Cancel alarm
```

## Tool Testing

```python
# Test tool independently
def test_api_tool():
    from openhands.sdk import Agent, LLM
    
    class MockConvState:
        agent = Agent(llm=LLM(model="anthropic/claude-sonnet-4"))
    
    # Create tool
    tool = APITestTool.create(MockConvState())[0]
    
    # Test execution
    result = tool.execute(
        method="GET",
        endpoint="/users/1"
    )
    
    assert result['success']
    assert result['status_code'] == 200
    assert 'body' in result

test_api_tool()
```

## Next Steps

- **[Workflows](/docs/guides/workflows)** - Use tools in multi-agent workflows
- **[Core Concepts: Tools & Skills](/docs/core-concepts/tools-and-skills)** - Deep dive
- **[Examples](/docs/examples/basic-test)** - See tools in action
