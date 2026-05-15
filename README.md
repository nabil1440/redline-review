# redline-review

Adaptive AI code review skill for any frontier agent — context-aware, rule-driven, diff-native.

## Install

```bash
npm install -g redline-review
```

Or run without installing:

```bash
npx redline-review
```

## Usage

```bash
# Full review via Claude API (requires ANTHROPIC_API_KEY)
redline-review

# Output the assembled prompt only (use with any LLM or agent)
redline-review --output prompt
```

## Setup

```bash
export ANTHROPIC_API_KEY=your-key
```

## How it works

1. Gets the git diff (`git diff main...HEAD` or fallback)
2. Loads all review rule categories from bundled YAML files
3. Assembles a focused, structured review prompt
4. Calls the Claude API (or outputs the prompt for your agent)

## Rule categories

| File | Category |
|---|---|
| `simplicity.yaml` | Simplicity & Clarity |
| `correctness.yaml` | Correctness & Safety |
| `auth.yaml` | Authentication & Authorization |
| `architecture.yaml` | Architecture & Design |
| `frontend.yaml` | Frontend Heuristics |
| `performance-db.yaml` | Database Performance |
| `performance-algorithmic.yaml` | Algorithmic Performance |
| `performance-system.yaml` | Distributed System Performance |
| `concurrency.yaml` | Concurrency & Consistency |
| `observability.yaml` | Observability |
| `maintainability.yaml` | Maintainability |
| `risk-patterns.yaml` | Risk Patterns |

## Agent adapters

The `adapters/` directory contains skill files for each supported agent:
- `adapters/claude/` — Claude Code skill

## License

MIT
