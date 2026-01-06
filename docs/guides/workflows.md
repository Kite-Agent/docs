---
sidebar_position: 5
---

# Complex Workflows

Learn how to build sophisticated testing workflows with KiteAgent.

## Multi-Page Workflows

```python
def test_checkout_workflow():
    agent = BrowsingAgent(...)
    conv = Conversation()

    # Product selection
    conv = agent.execute(conv, "Search for 'laptop'")
    conv = agent.execute(conv, "Click first result")
    conv = agent.execute(conv, "Click 'Add to Cart'")

    # Cart review
    conv = agent.execute(conv, "Navigate to cart")
    conv = agent.execute(conv, "Verify cart contains 1 item")

    # Checkout
    conv = agent.execute(conv, "Click 'Checkout'")
    conv = agent.execute(conv, "Fill shipping address")
    conv = agent.execute(conv, "Select payment method")
    conv = agent.execute(conv, "Click 'Place Order'")

    # Confirmation
    conv = agent.execute(conv, "Verify order confirmation displayed")

    return conv
```

## Conditional Logic

```python
def test_with_conditions(agent: BrowsingAgent):
    conv = Conversation()

    conv = agent.execute(conv, "Navigate to product page")

    # Check if item is in stock
    stock_check = agent.execute(
        conv,
        "Check if 'In Stock' text is visible"
    )

    if stock_check.has_element("text=In Stock"):
        conv = agent.execute(conv, "Click 'Add to Cart'")
    else:
        conv = agent.execute(conv, "Click 'Notify Me'")

    return conv
```

## Parallel Execution

```python
import asyncio

async def run_parallel_tests():
    agent = BrowsingAgent(...)

    # Run multiple tests in parallel
    results = await asyncio.gather(
        test_login(agent),
        test_registration(agent),
        test_password_reset(agent)
    )

    return results
```

## Data-Driven Testing

```python
test_data = [
    {"username": "user1", "password": "pass1", "should_succeed": True},
    {"username": "user2", "password": "wrong", "should_succeed": False},
    {"username": "user3", "password": "pass3", "should_succeed": True}
]

for data in test_data:
    conv = agent.execute(
        Conversation(),
        f'Login with username "{data["username"]}" and password "{data["password"]}"'
    )

    succeeded = not conv.has_failures()
    assert succeeded == data["should_succeed"], \
        f"Test case failed for {data['username']}"
```

## Next Steps

- **[Examples](../examples/basic-test)**: Real-world scenarios
- **[API Reference](../api/agents)**: Complete API docs
