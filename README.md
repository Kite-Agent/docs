# KiteAgent Documentation

> **AI-Native Automation Testing Platform**

Official documentation for KiteAgent - an intelligent automation testing platform that combines the power of LangGraph orchestration, Browser-use interaction capabilities, and OpenHands event-driven architecture.

## 🚀 Features

- **AI-Powered Testing**: Intelligent test execution with self-healing capabilities
- **Event-Driven Architecture**: Reliable, reproducible test sessions
- **Multi-Agent System**: Specialized agents for planning, execution, and code generation
- **DOM Intelligence**: Smart DOM compression for efficient LLM processing
- **Extensible Design**: Easy integration of new testing capabilities

## 📖 Documentation

This documentation site is built using [Docusaurus](https://docusaurus.io/).

### Installation

```bash
yarn install
```

### Local Development

```bash
yarn start
```

This command starts a local development server and opens your browser to `http://localhost:3000`.

### Build

```bash
yarn build
```

Generates static content into the `build` directory for production deployment.

### Deployment

Using SSH:

```bash
USE_SSH=true yarn deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> yarn deploy
```

## 📝 Contributing

Contributions to the documentation are welcome! Please ensure all code examples follow the architectural principles outlined in the Core Concepts section.

## 📄 License

MIT License - See LICENSE file for details
