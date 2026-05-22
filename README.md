# redline-review

Adaptive AI code review skill for any frontier agent — context-aware, rule-driven, diff-native.

`redline-review` assembles a focused review prompt from your git diff and injects only the rule categories relevant to your stack. Your agent (Claude Code, Copilot, Codex, etc.) performs the actual review using its own model. No API keys. No external calls.

---

## Getting started

### Step 1 — Install

```bash
npm install -g redline-review
```

### Step 2 — Verify it works

```bash
which redline-review
# → /path/to/node/bin/redline-review

redline-review | head -5
```

---

## Using as a Claude Code command

There are two ways to install the command — global (recommended) or per-project.

### Global install — available in every project

```bash
mkdir -p ~/.claude/commands
cp $(npm root -g)/redline-review/adapters/claude/redline-review.md ~/.claude/commands/redline-review.md
```

That's it. Open any project in Claude Code and `/redline-review` will be available immediately — no per-project setup needed.

### Per-project install — scoped to one project

```bash
cd /your/project
mkdir -p .claude/commands
cp $(npm root -g)/redline-review/adapters/claude/redline-review.md .claude/commands/redline-review.md
```

### Use it in Claude Code

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

## Review modes

### Default — branch diff (PR-style)

```bash
redline-review
```

Diffs the current branch against the detected base branch and assembles a review prompt. This is the original behavior — no subcommand needed.

### Range — review between two commits

```bash
redline-review range --from <commit-ish> --to <commit-ish>
```

One-shot review of everything that changed between two refs. `--to` defaults to `HEAD` if omitted.

```bash
# Review changes between two tags
redline-review range --from v1.0.0 --to v1.1.0

# Review the last 5 commits
redline-review range --from HEAD~5 --to HEAD

# Strict mode
redline-review range --from main --to HEAD --prompt strict
```

### Walk — commit-by-commit review

```bash
redline-review walk --start [--from <ref>] [--to <ref>] [--interval N] [--direction backwards|forwards]
redline-review walk --next
redline-review walk --status
redline-review walk --reset
```

Steps through commits one at a time (or in batches), emitting a review prompt for each step. State is persisted in `.git/redline-walk.json`.

```bash
# Start walking backwards from HEAD to main (default)
redline-review walk --start

# Walk in batches of 2 commits
redline-review walk --start --interval 2

# Walk forwards from a specific point
redline-review walk --start --from v1.0.0 --direction forwards

# Get the next review prompt
redline-review walk --next

# Check progress
redline-review walk --status

# Clear walk state
redline-review walk --reset
```

The interactive "review → ask → continue" loop lives in your agent (see adapter docs), not in the CLI. The CLI stays stateless per invocation — it reads/writes a small state file but each call is a single deterministic function.

Flags passed at `--start` time (`--stack`, `--type`, `--prompt`) are captured into state and reused for every `--next`.

### Repo — full repository review

```bash
redline-review repo [--max-tree-depth N] [--stack ...] [--type ...] [--prompt ...]
```

Emits a review prompt that instructs your agent to systematically explore the entire repository. The prompt includes:

- An annotated file tree with navigation hints (`[entry-point]`, `[config]`, `[migration]`, `[orchestration]`, `[largest]`)
- Inlined orientation files (package.json, go.mod, README, CI workflows, etc.)
- Architecture review dimensions (module boundaries, hidden coupling, consistency, abstraction quality, reliability hazards, architectural drift)
- Rule-based focus areas auto-detected from file extensions

```bash
# Review this repo
redline-review repo

# Limit tree depth for large repos
redline-review repo --max-tree-depth 3

# Override with explicit stack
redline-review repo --stack go --type architecture,concurrency
```

---

## Flags

All flags work with all modes (default, range, walk, repo).

### `--type` — focus by concern

```bash
redline-review --type auth
redline-review --type auth,backend,performance
```

| Value           | Rule categories loaded                                      |
| --------------- | ----------------------------------------------------------- |
| `auth`          | auth, correctness                                           |
| `security`      | auth, correctness, risk-patterns                            |
| `performance`   | db-performance, system-performance, algorithmic-performance |
| `backend`       | correctness, concurrency, observability                     |
| `frontend`      | frontend, simplicity                                        |
| `architecture`  | architecture, maintainability                               |
| `concurrency`   | concurrency, correctness                                    |
| `observability` | observability, correctness                                  |
| `risk`          | risk-patterns, architecture                                 |

### `--stack` — focus by technology

```bash
redline-review --stack laravel
redline-review --stack go --type backend
```

| Stack               | Focus areas                                                 | Why                                             |
| ------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| `laravel`           | architecture, db-performance                                | ORM-heavy, layered architecture                 |
| `inertia`           | frontend, architecture                                      | SSR frontend patterns                           |
| `react`             | frontend                                                    | Component & state patterns                      |
| `vue`               | frontend                                                    | Component & state patterns                      |
| `svelte`            | frontend                                                    | Component & state patterns                      |
| `node`              | concurrency, system-performance                             | Async I/O, event loop                           |
| `django`            | architecture, db-performance                                | ORM, layered architecture                       |
| `rails`             | architecture, db-performance                                | ORM, layered architecture                       |
| `go`                | concurrency, system-performance, correctness, observability | Goroutines, error handling, distributed systems |
| `csharp` / `dotnet` | architecture, correctness, concurrency, system-performance  | DDD/clean arch, async/await, nullability        |
| `java`              | architecture, concurrency, db-performance, correctness      | Spring/JPA, Hibernate N+1, thread safety        |

### `--prompt` — control review depth

```bash
redline-review --prompt base         # default for diff-based modes
redline-review --prompt strict       # CRITICAL and HIGH only + fix suggestions
redline-review --prompt lightweight  # top 3 issues only
```

| Value            | Output                                             |
| ---------------- | -------------------------------------------------- |
| `base` (default) | All issues grouped CRITICAL → HIGH → MEDIUM → LOW |
| `strict`         | CRITICAL and HIGH only, concrete fix per issue     |
| `lightweight`    | Top 3 issues, one tight paragraph each             |

Repo mode defaults to its own `repo-reviewer` template (agent-driven exploration). Pass `--prompt strict` or `--prompt lightweight` to override.

### `--base` — override base branch

```bash
redline-review --base origin/develop
redline-review --base main
```

Only applies to the default (branch diff) mode. Range and walk use `--from`/`--to` instead.

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

# Review a release range
redline-review range --from v1.2.0 --to v1.3.0

# Walk through a feature branch commit by commit
redline-review walk --start --prompt strict
redline-review walk --next
redline-review walk --next

# Full repo audit
redline-review repo

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

For repo mode (no diff), detection is based on file extensions in the repository.

Detected domains are printed to stderr so they don't pollute the prompt:

```
Domains (auto-detected): auth.yaml, concurrency.yaml, performance-db.yaml
```

---

## Rule categories

| Category                  | What it catches                                                |
| ------------------------- | -------------------------------------------------------------- |
| Auth & Authorization      | Missing auth checks, IDOR, privilege bypass, hardcoded roles   |
| Correctness & Safety      | Swallowed exceptions, hidden side effects, bad error messages  |
| Architecture & Design     | God classes, responsibility leakage, bad abstractions          |
| Frontend Heuristics       | God components, duplicated state, prop drilling                |
| Database Performance      | N+1 queries, unbounded queries, overfetching                   |
| Algorithmic Performance   | Nested loops, brute-force, bad complexity                      |
| System Performance        | Sync waterfalls, serialized I/O, excess roundtrips             |
| Concurrency & Consistency | Race conditions, missing transactions, non-idempotent retries  |
| Observability             | Sensitive data in logs, missing error logging, silent failures |
| Simplicity & Clarity      | Redundant checks, nested conditionals, unclear naming          |
| Maintainability           | Large functions, implicit mutations, future change friction    |
| Risk Patterns             | Dangerous defaults, hidden blast radius, fragile assumptions   |

---

## Other agents

Adapter files for other agents are in `adapters/`:

| Agent          | Command                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Claude Code    | `cp $(npm root -g)/redline-review/adapters/claude/redline-review.md ~/.claude/commands/redline-review.md` |
| GitHub Copilot | `cp $(npm root -g)/redline-review/adapters/copilot/redline-review.md .github/copilot-instructions.md`    |
| Codex CLI      | `cp $(npm root -g)/redline-review/adapters/codex/redline-review.md AGENTS.md`                            |
| OpenCode       | `cp $(npm root -g)/redline-review/adapters/opencode/redline-review.md AGENTS.md`                         |
| Anti-gravity   | `cp $(npm root -g)/redline-review/adapters/antigravity/redline-review.md <your-config-path>`             |

Each adapter follows the same pattern: run `redline-review`, take the output as the review task.

For the commit walk interactive flow, adapters should:

1. Run `redline-review walk --start` and perform the review
2. Ask the user: "Continue to the next commit?"
3. If yes, run `redline-review walk --next` and repeat
4. When walk is complete (exit 0 with no stdout), inform the user

---

## License

MIT
