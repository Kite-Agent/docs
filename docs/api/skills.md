---
sidebar_position: 5
---

# Skills API

Complete reference for skill interfaces and implementations.

## Skill Interface

Base interface for all skills.

```typescript
interface Skill {
  name: string;
  canHandle(error: Error): boolean;
  recover(conversation: Conversation, error: Error): Promise<Action>;
}
```

---

## SelfHealingSkill

Automatically recovers from selector failures.

### Constructor

```typescript
new SelfHealingSkill(config?: SelfHealingConfig)
```

#### SelfHealingConfig

```typescript
interface SelfHealingConfig {
  visionModel?: string;
  maxRetries?: number;
  similarityThreshold?: number;
  cacheHealedSelectors?: boolean;
}
```

**Default Values:**

- `visionModel`: `'gpt-4-vision'`
- `maxRetries`: `3`
- `similarityThreshold`: `0.85`
- `cacheHealedSelectors`: `true`

### Methods

#### canHandle()

Check if skill can handle error.

```typescript
canHandle(error: Error): boolean
```

**Returns:** `true` for `ElementNotFoundException`

#### recover()

Recover from error.

```typescript
async recover(
  conversation: Conversation,
  error: ElementNotFoundException
): Promise<Action>
```

**Returns:** New action with healed selector

---

## VisualCheckSkill

Compare UI against reference screenshots.

### Constructor

```typescript
new VisualCheckSkill(config?: VisualCheckConfig)
```

#### VisualCheckConfig

```typescript
interface VisualCheckConfig {
  threshold?: number;
  ignoreRegions?: Region[];
  algorithm?: "ssim" | "pixelmatch";
}
```

### Methods

#### compare()

Compare two screenshots.

```typescript
async compare(
  reference: string,
  current: string
): Promise<VisualDiffResult>
```

**Parameters:**

- `reference`: Base64 reference screenshot
- `current`: Base64 current screenshot

**Returns:**

```typescript
interface VisualDiffResult {
  similarity: number;
  passed: boolean;
  diffImage?: string;
}
```

---

## AccessibilitySkill (Future)

Check WCAG compliance.

### Constructor

```typescript
new AccessibilitySkill(config?: AccessibilityConfig)
```

#### AccessibilityConfig

```typescript
interface AccessibilityConfig {
  wcagLevel?: "A" | "AA" | "AAA";
  rules?: string[];
}
```

### Methods

#### checkCompliance()

Check page for accessibility issues.

```typescript
async checkCompliance(dom: string): Promise<AccessibilityReport>
```

**Returns:**

```typescript
interface AccessibilityReport {
  passed: boolean;
  issues: AccessibilityIssue[];
}

interface AccessibilityIssue {
  rule: string;
  severity: "error" | "warning";
  message: string;
  element?: string;
}
```

## Next Steps

- **[Tools API](./tools)**: Tool reference
- **[Agents API](./agents)**: Using skills with agents
- **[Examples: Self-Healing](../examples/self-healing)**: See skills in action
