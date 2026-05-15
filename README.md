# redline-review

Adaptive AI code review skill for any frontier agent — context-aware, rule-driven, diff-native.

Instead of injecting a giant bloated prompt, `redline-review` assembles a **focused review prompt** from the git diff and only the rule categories relevant to your stack. Your agent (Claude Code, Copilot, Codex, OpenCode, etc.) performs the actual review using its own model.

No API keys. No external calls. Pure prompt assembly.

---

## Install

```bash
npm install -g redline-review
```

Or run without installing:

```bash
npx redline-review
```

---

## Quickstart

Navigate to any git project and run:

```bash
redline-review
```

This will:
1. Run `git diff main...HEAD` (falls back through `master...HEAD` → `HEAD~1` → `--cached`)
2. Load all 12 rule categories
3. Print the assembled review prompt to stdout

**Paste or pipe that output into your agent** and it will perform the review.

---

## How to use with each agent

### Claude Code

Place `adapters/claude/redline-review.md` from this repo into your project at:

```
.claude/commands/redline-review.md
```

Then in Claude Code, run:

```
/redline-review
```

Claude Code will run the CLI, receive the assembled prompt, and perform the review inline.

### GitHub Copilot (VS Code)

Add to `.github/copilot-instructions.md` in your project:

```markdown
When asked to review code, run `redline-review` in the terminal first and use the output as your review instructions.
```

Then ask Copilot to review your code — it will invoke the CLI and work from the output.

### Codex CLI

Add to your project's `AGENTS.md`:

```markdown
When performing a code review, run `redline-review` and use the output as your review criteria.
```

### OpenCode

Add to your OpenCode session instructions or `AGENTS.md`:

```markdown
When asked to review code, run `redline-review` and use the output as your review task.
```

### Anti-gravity

Run `redline-review` as a shell command within your session and pass the output as the review task.

---

## Flags

### `--type` — focus by review concern

Load only the rule categories relevant to what you're reviewing.

```bash
redline-review --type auth
redline-review --type performance
redline-review --type auth,backend,performance
```

| Value | Rule categories loaded |
|---|---|
| `auth` | auth, correctness |
| `security` | auth, correctness, risk-patterns |
| `performance` | db-performance, system-performance, algorithmic-performance |
| `backend` | correctness, concurrency, observability |
| `frontend` | frontend, simplicity |
| `architecture` | architecture, maintainability |
| `concurrency` | concurrency, correctness |
| `observability` | observability, correctness |
| `risk` | risk-patterns, architecture |

### `--stack` — focus by technology stack

Automatically load the rules most relevant to your stack's common failure patterns.

```bash
redline-review --stack laravel
redline-review --stack go
redline-review --stack java --type auth,backend
```

| Stack | Rule categories loaded | Why |
|---|---|---|
| `laravel` | architecture, db-performance | ORM-heavy, layered architecture |
| `inertia` | frontend, architecture | SSR frontend patterns |
| `react` | frontend | Component & state patterns |
| `vue` | frontend | Component & state patterns |
| `svelte` | frontend | Component & state patterns |
| `node` | concurrency, system-performance | Async I/O, event loop patterns |
| `django` | architecture, db-performance | ORM, layered architecture |
| `rails` | architecture, db-performance | ORM, layered architecture |
| `go` | concurrency, system-performance, correctness, observability | Goroutines, channels, error handling |
| `csharp` | architecture, correctness, concurrency, system-performance | DDD/clean arch, async/await, nullability |
| `dotnet` | architecture, correctness, concurrency, system-performance | Alias for `csharp` |
| `java` | architecture, concurrency, db-performance, correctness | Spring/JPA, Hibernate N+1, thread safety |

You can combine `--stack` and `--type` — rules are merged and deduplicated:

```bash
redline-review --stack laravel,inertia --type auth,performance
```

### `--prompt` — control review depth

```bash
redline-review --prompt base         # default: full review, all severities
redline-review --prompt strict       # CRITICAL and HIGH issues only, with fix suggestions
redline-review --prompt lightweight  # top 3 issues only, one paragraph each
```

| Value | Output |
|---|---|
| `base` (default) | All issues grouped by severity: CRITICAL → HIGH → MEDIUM → LOW |
| `strict` | CRITICAL and HIGH only, with a concrete fix per issue |
| `lightweight` | Top 3 issues maximum, tight single-paragraph format |

---

## Examples

```bash
# Full review, all rules
redline-review

# Laravel + Inertia app, auth and backend review
redline-review --stack laravel,inertia --type auth,backend

# Go service, strict mode (CRITICAL/HIGH only)
redline-review --stack go --prompt strict

# Java backend, quick scan
redline-review --stack java --prompt lightweight

# Focused security review for any stack
redline-review --type security

# Pipe to clipboard (macOS)
redline-review | pbcopy

# Preview the first 80 lines
redline-review | head -80
```

---

## Rule categories

| File | Category | What it catches |
|---|---|---|
| `auth.yaml` | Authentication & Authorization | Missing auth checks, IDOR, privilege bypass, hardcoded roles |
| `correctness.yaml` | Correctness & Safety | Swallowed exceptions, hidden side effects, ambiguous failures, bad error messages |
| `architecture.yaml` | Architecture & Design | God classes, responsibility leakage, unclear boundaries, bad abstractions |
| `frontend.yaml` | Frontend Heuristics | God components, duplicated state, prop drilling, unnecessary dependencies |
| `performance-db.yaml` | Database Performance | N+1 queries, unbounded queries, overfetching, missing pagination |
| `performance-algorithmic.yaml` | Algorithmic Performance | Nested loops, brute-force solutions, bad complexity, excessive allocations |
| `performance-system.yaml` | Distributed System Performance | Sync waterfalls, serialized I/O, excessive roundtrips |
| `concurrency.yaml` | Concurrency & Consistency | Race conditions, missing transactions, non-idempotent retries, distributed locks |
| `observability.yaml` | Observability | Sensitive data in logs, missing error logging, silent failures, no tracing |
| `simplicity.yaml` | Simplicity & Clarity | Redundant checks, nested conditionals, chained ternaries, unclear naming |
| `maintainability.yaml` | Maintainability | Large functions, implicit mutations, poor naming, future change friction |
| `risk-patterns.yaml` | Risk Patterns | Dangerous defaults, hidden blast radius, fragile assumptions, single points of failure |

---

## Project structure

```
redline-review/
├── src/
│   ├── redline-review.ts     # CLI entry point
│   └── build-context.ts      # stack/type → rule file mapper
├── rules/                    # YAML rule definitions (12 files)
├── prompts/
│   ├── base-reviewer.md      # default prompt template
│   ├── strict-reviewer.md    # CRITICAL/HIGH only
│   └── lightweight-reviewer.md  # top 3 issues
├── adapters/
│   ├── claude/               # Claude Code skill file
│   ├── opencode/             # OpenCode instructions
│   ├── codex/                # Codex CLI AGENTS.md snippet
│   ├── copilot/              # GitHub Copilot instructions
│   └── antigravity/          # Anti-gravity instructions
├── schemas/
│   └── rule.schema.json      # JSON schema for rule files
└── bin/
    └── redline-review        # CLI entry shim
```

---

## License

MIT
