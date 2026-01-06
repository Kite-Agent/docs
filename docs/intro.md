---
sidebar_position: 1
slug: /
---

# Get Started

**AI-native automation testing built on OpenHands**

KiteAgent extends [OpenHands](https://github.com/OpenHands/OpenHands) with specialized testing capabilities, integrating [Browser-use](https://github.com/browser-use/browser-use) for browser automation and [LangGraph](https://github.com/langchain-ai/langgraph) for multi-agent orchestration.

## What is KiteAgent?

```
OpenHands Core (Event-driven, Stateless Agents)
    ↓
+ Browser-use (Browser Automation)
    ↓
+ LangGraph (Multi-Agent Orchestration)
    ↓
= KiteAgent (AI Testing Platform)
```

KiteAgent inherits OpenHands' design principles:

- **Stateless agents** - All state in `Conversation`
- **Event-driven** - Immutable event history
- **One source of truth** - Replay from conversation
- **Extensible** - Add capabilities via Tools & Skills

## Quick Start

```bash
pip install kite-agent
```

```python
from kite_agent import KiteAgent
import os

agent = KiteAgent(
    llm={"model": "gpt-4", "api_key": os.getenv("OPENAI_API_KEY")}
)

# Natural language test
conversation = agent.test(
    url="https://example.com",
    scenario="Login with admin credentials and verify dashboard"
)

# Generate Playwright code
code = agent.generate_code(conversation, framework="playwright")
print(code)
```

## Key Differences from OpenHands

| Feature | OpenHands                    | KiteAgent                  |
| ------- | ---------------------------- | -------------------------- |
| Domain  | General software development | Testing automation         |
| Browser | Generic sandbox              | Browser-use integration    |
| Agents  | Code/Browser agents          | Testing-specialized agents |
| Output  | Code changes                 | Test code + artifacts      |
| Events  | Generic events               | Testing-specific events    |

## Architecture

```
┌─────────────────────────────────────────┐
│  LangGraph Orchestration Layer         │
│  (Supervisor → Planner → Workers)      │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  KiteAgent Core (OpenHands-compliant)  │
│  • Browsing Agent                       │
│  • Coding Agent                         │
│  • Conversation State                   │
│  • DOM Condenser                        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  Browser-use Integration                │
│  • Browser Tool                         │
│  • Self-Healing Skill                   │
└─────────────────────────────────────────┘
```

## Documentation Structure

- **[Core Concepts](./core-concepts/architecture)** - OpenHands principles + testing extensions
- **[Guides](./guides/getting-started)** - Practical usage
- **[API Reference](./api/agents)** - Complete API
- **[Examples](./examples/basic-test)** - Real-world code

## Learn More

- **OpenHands**: [docs.all-hands.dev](https://docs.all-hands.dev)
- **Browser-use**: [browser-use.com](https://browser-use.com)
- **LangGraph**: [langchain-ai.github.io/langgraph](https://langchain-ai.github.io/langgraph)

## Community & Support

- **GitHub**: [github.com/kite-agent/kite-agent](https://github.com/kite-agent/kite-agent)
- **Discord**: Join our community for help and discussions
- **Documentation**: You're already here! 📚

---

**Ready to transform your testing workflow?** Let's get started! 🚀
