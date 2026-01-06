import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // Main documentation sidebar
  docsSidebar: [
    "intro",
    {
      type: "category",
      label: "Core Concepts",
      items: [
        "core-concepts/architecture",
        "core-concepts/design-principles",
        "core-concepts/agents",
        "core-concepts/events",
        "core-concepts/conversation",
        "core-concepts/tools-and-skills",
      ],
    },
    {
      type: "category",
      label: "Guides",
      items: [
        "guides/getting-started",
        "guides/agents",
        "guides/events",
        "guides/tools",
        "guides/workflows",
      ],
    },
    {
      type: "category",
      label: "Examples",
      items: [
        "examples/basic-test",
        "examples/self-healing",
        "examples/code-generation",
      ],
    },
  ],

  // API Reference sidebar
  apiSidebar: [
    {
      type: "category",
      label: "API Reference",
      items: [
        "api/agents",
        "api/events",
        "api/conversation",
        "api/tools",
        "api/skills",
      ],
    },
  ],
};

export default sidebars;
