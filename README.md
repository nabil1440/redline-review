# redline-review

Adaptive AI code review skill for any frontier agent — context-aware, rule-driven, diff-native.

`redline-review` assembles a focused review prompt from your git diff and injects only the rule categories relevant to your stack. Your agent (Claude Code, Copilot, Codex, etc.) performs the actual review using its own model. No API keys. No external calls.

---

## Getting started

### Step 1 — Clone the repo

```bash
git clone https://github.com/mousumaisa/redline-review
cd redline-review
```

### Step 2 — Install dependencies and build

```bash
npm install
```

The build runs automatically as part of install (`prepare` script). You should see `tsc` compile without errors.

### Step 3 — Install globally

```bash
npm link
```

This makes `redline-review` available as a global command from any directory on your machine.

### Step 4 — Verify it works

```bash
which redline-review
# → /path/to/node/bin/redline-review

redline-review --help 2>&1 || redline-review | head -5
```

---

## Using as a Claude Code command

There are two ways to install the command — global (recommended) or per-project.

### Global install — available in every project

```bash
mkdir -p ~/.claude/commands
cp /path/to/redline-review/adapters/claude/redline-review.md ~/.claude/commands/redline-review.md
```

That's it. Open any project in Claude Code and `/redline-review` will be available immediately — no per-project setup needed.

### Per-project install — scoped to one project

```bash
cd /your/project
mkdir -p .claude/commands
cp /path/to/redline-review/adapters/claude/redline-review.md .claude/commands/redline-review.md
```

### Step 6 — Use it in Claude Code

Open any project in Claude Code and type:

```
/redline-review
```

Claude Code will:
1. Run `redline-review` as a shell command
2. Receive the assembled review prompt (rules + your git diff)
3. Perform the code review inline using its own model

You can pass flags directly:

```
/redline-review --stack laravel --type auth,backend
/redline-review --prompt strict
```

---

## How it works

1. Detects your git diff automatically (`git diff main...HEAD`, falls back through `master...HEAD` → `HEAD~1` → `--cached`)
2. **Auto-detects relevant rule categories** from the diff content (or uses your `--stack`/`--type` flags)
3. Prints the assembled review prompt to stdout
4. Your agent reads that prompt and performs the review — no external calls made by the CLI

---

## Flags

### `--type` — focus by concern

```bash
redline-review --type auth
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

### `--stack` — focus by technology

```bash
redline-review --stack laravel
redline-review --stack go --type backend
```

| Stack | Focus areas | Why |
|---|---|---|
| `laravel` | architecture, db-performance | ORM-heavy, layered architecture |
| `inertia` | frontend, architecture | SSR frontend patterns |
| `react` | frontend | Component & state patterns |
| `vue` | frontend | Component & state patterns |
| `svelte` | frontend | Component & state patterns |
| `node` | concurrency, system-performance | Async I/O, event loop |
| `django` | architecture, db-performance | ORM, layered architecture |
| `rails` | architecture, db-performance | ORM, layered architecture |
| `go` | concurrency, system-performance, correctness, observability | Goroutines, error handling, distributed systems |
| `csharp` / `dotnet` | architecture, correctness, concurrency, system-performance | DDD/clean arch, async/await, nullability |
| `java` | architecture, concurrency, db-performance, correctness | Spring/JPA, Hibernate N+1, thread safety |

### `--prompt` — control review depth

```bash
redline-review --prompt base         # default
redline-review --prompt strict       # CRITICAL and HIGH only + fix suggestions
redline-review --prompt lightweight  # top 3 issues only
```

| Value | Output |
|---|---|
| `base` (default) | All issues grouped CRITICAL → HIGH → MEDIUM → LOW |
| `strict` | CRITICAL and HIGH only, concrete fix per issue |
| `lightweight` | Top 3 issues, one tight paragraph each |

---

## Examples

```bash
# Auto-detect everything (recommended default)
redline-review

# Laravel + Inertia, focused on auth and backend
redline-review --stack laravel,inertia --type auth,backend

# Go service, strict pass (CRITICAL/HIGH only)
redline-review --stack go --prompt strict

# Java backend, quick scan
redline-review --stack java --prompt lightweight

# Security review, any stack
redline-review --type security

# Pipe to clipboard (macOS) — paste into any agent
redline-review | pbcopy

# Preview the prompt
redline-review | head -80
```

---

## Auto-detection

When no `--type` or `--stack` flags are given, `redline-review` scans the diff for keyword patterns and loads only the matching rule files. For example:

- Diff contains `middleware`, `policy`, `permission` → loads `auth.yaml`
- Diff contains `goroutine`, `mutex`, `transaction` → loads `concurrency.yaml`
- Diff contains `->with(`, `paginate`, `::all()` → loads `performance-db.yaml`
- Diff contains `useState`, `useEffect`, `.tsx` → loads `frontend.yaml`

If nothing is detected, falls back to `correctness + maintainability + risk-patterns`.

Detected domains are printed to stderr so they don't pollute the prompt:

```
Domains (auto-detected): auth.yaml, concurrency.yaml, performance-db.yaml
```

---

## Rule categories

| Category | What it catches |
|---|---|
| Auth & Authorization | Missing auth checks, IDOR, privilege bypass, hardcoded roles |
| Correctness & Safety | Swallowed exceptions, hidden side effects, bad error messages |
| Architecture & Design | God classes, responsibility leakage, bad abstractions |
| Frontend Heuristics | God components, duplicated state, prop drilling |
| Database Performance | N+1 queries, unbounded queries, overfetching |
| Algorithmic Performance | Nested loops, brute-force, bad complexity |
| System Performance | Sync waterfalls, serialized I/O, excess roundtrips |
| Concurrency & Consistency | Race conditions, missing transactions, non-idempotent retries |
| Observability | Sensitive data in logs, missing error logging, silent failures |
| Simplicity & Clarity | Redundant checks, nested conditionals, unclear naming |
| Maintainability | Large functions, implicit mutations, future change friction |
| Risk Patterns | Dangerous defaults, hidden blast radius, fragile assumptions |

---

## Other agents

Adapter files for other agents are in `adapters/`:

| Agent | File to use |
|---|---|
| Claude Code | `adapters/claude/redline-review.md` → `.claude/commands/redline-review.md` |
| GitHub Copilot | `adapters/copilot/redline-review.md` → `.github/copilot-instructions.md` |
| Codex CLI | `adapters/codex/redline-review.md` → `AGENTS.md` |
| OpenCode | `adapters/opencode/redline-review.md` → `AGENTS.md` |
| Anti-gravity | `adapters/antigravity/redline-review.md` |

Each adapter follows the same pattern: run `redline-review`, take the output as the review task.

---

## License

MIT
