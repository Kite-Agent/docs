---
sidebar_position: 5
---

# Skills API

Complete reference for skill interfaces and implementations.

## Skill Interface

Base interface for all skills.

```python
from typing import Protocol

class Skill(Protocol):
    name: str

    def can_handle(self, error: Exception) -> bool:
        ...

    def recover(self, conversation: Conversation, error: Exception) -> Action:
        ...
```

---

## SelfHealingSkill

Automatically recovers from selector failures.

### Constructor

```python
SelfHealingSkill(config: Optional[SelfHealingConfig] = None)
```

#### SelfHealingConfig

```python
@dataclass
class SelfHealingConfig:
    vision_model: str = "gpt-4-vision"
    max_retries: int = 3
    similarity_threshold: float = 0.85
    cache_healed_selectors: bool = True
```

**Default Values:**

- `visionModel`: `'gpt-4-vision'`
- `maxRetries`: `3`
- `similarityThreshold`: `0.85`
- `cacheHealedSelectors`: `true`

### Methods

#### can_handle()

Check if skill can handle error.

```python
def can_handle(self, error: Exception) -> bool:
```

**Returns:** `true` for `ElementNotFoundException`

#### recover()

Recover from error.

```python
def recover(
    self,
    conversation: Conversation,
    error: ElementNotFoundException
) -> Action:
```

**Returns:** New action with healed selector

---

## VisualCheckSkill

Compare UI against reference screenshots.

### Constructor

```python
VisualCheckSkill(config: Optional[VisualCheckConfig] = None)
```

#### VisualCheckConfig

```python
@dataclass
class VisualCheckConfig:
    threshold: float = 0.95
    ignore_regions: List[Region] = field(default_factory=list)
    algorithm: Literal["ssim", "pixelmatch"] = "ssim"
```

### Methods

#### compare()

Compare two screenshots.

```python
def compare(
    self,
    reference: str,
    current: str
) -> VisualDiffResult:
```

**Parameters:**

- `reference`: Base64 reference screenshot
- `current`: Base64 current screenshot

**Returns:**

```python
@dataclass
class VisualDiffResult:
    similarity: float
    passed: bool
    diff_image: Optional[str] = None
```

---

## AccessibilitySkill (Future)

Check WCAG compliance.

### Constructor

```python
AccessibilitySkill(config: Optional[AccessibilityConfig] = None)
```

#### AccessibilityConfig

```python
@dataclass
class AccessibilityConfig:
    wcag_level: Literal["A", "AA", "AAA"] = "AA"
    rules: List[str] = field(default_factory=list)
```

### Methods

#### check_compliance()

Check page for accessibility issues.

```python
def check_compliance(self, dom: str) -> AccessibilityReport:
```

**Returns:**

```python
@dataclass
class AccessibilityReport:
    passed: bool
    issues: List[AccessibilityIssue]

@dataclass
class AccessibilityIssue:
    rule: str
    severity: Literal["error", "warning"]
    message: str
    element: Optional[str] = None
```

## Next Steps

- **[Tools API](./tools)**: Tool reference
- **[Agents API](./agents)**: Using skills with agents
- **[Examples: Self-Healing](../examples/self-healing)**: See skills in action
