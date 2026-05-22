# redline-review — Handoff Document

## Overview

redline-review is a CLI tool that assembles focused AI code review prompts from git diffs and YAML rule definitions. It makes no external API calls — it outputs a ready-to-use review prompt to stdout that any AI agent can consume. Install globally via `npm i -g redline-review`.

The tool solves a specific problem: generic "review my code" prompts produce shallow feedback. redline-review injects domain-specific heuristics (auth, concurrency, performance, etc.) so the reviewing agent knows exactly what to look for.

## Architecture

Three TypeScript modules form a linear pipeline:

```
parseArgs → getGitDiff → resolve context → loadRules → formatRules → buildPrompt → stdout
```

### `src/redline-review.ts` — CLI Orchestrator

The main entry point. Parses CLI flags, detects the git base branch, extracts the diff, loads the appropriate rules, merges everything into a prompt template, and writes the result to stdout. Diagnostic messages (detected base branch, selected domains) go to stderr so they don't pollute piped output.

Key functions:
- `parseArgs()` — extracts `--stack`, `--type`, `--prompt`, `--base` from argv
- `detectBaseBranch()` — resolves base via upstream tracking → `origin/HEAD` → common branch names
- `getGitDiff()` — runs `git diff <base>...HEAD` with fallbacks to `HEAD~1` and `--cached`
- `loadRules()` — reads and parses selected YAML rule files
- `formatRulesForPrompt()` — converts structured rules into markdown with severity badges and examples
- `buildPrompt()` — substitutes `{{selectedRules}}` and `{{gitDiff}}` into a prompt template

### `src/build-context.ts` — Context Selector

Maps high-level `--stack` and `--type` flags to concrete rule file sets.

Review type mappings:

| `--type` value | Rule files loaded |
|---|---|
| `auth` | auth, correctness |
| `security` | auth, correctness, risk-patterns |
| `performance` | performance-db, performance-system, performance-algorithmic |
| `backend` | correctness, concurrency, observability |
| `frontend` | frontend, simplicity |
| `architecture` | architecture, maintainability |
| `concurrency` | concurrency, correctness |
| `observability` | observability, correctness |
| `risk` | risk-patterns, architecture |

Stack mappings (subset):

| `--stack` value | Rule files loaded |
|---|---|
| `laravel`, `django`, `rails` | architecture, performance-db |
| `react`, `vue`, `svelte` | frontend |
| `node` | concurrency, performance-system |
| `go` | concurrency, performance-system, correctness, observability |
| `java` | architecture, concurrency, performance-db, correctness |

### `src/detect-domains.ts` — Auto-Detection

When no `--stack` or `--type` flags are provided, this module scans the diff content for keyword patterns and returns matching rule files. For example, `useState` or `.tsx` triggers `frontend.yaml`; `transaction` or `mutex` triggers `concurrency.yaml`.

Fallback when nothing matches: `correctness.yaml`, `maintainability.yaml`, `risk-patterns.yaml`.

## Project Structure

```
redline-review/
├── bin/
│   └── redline-review              # Executable entry (#!/usr/bin/env node)
├── src/
│   ├── redline-review.ts           # CLI orchestrator
│   ├── build-context.ts            # --stack/--type → rule file mapper
│   └── detect-domains.ts           # Diff keyword → rule file auto-detector
├── dist/                            # Compiled JS output (tsc)
├── rules/                           # 12 YAML rule categories
│   ├── auth.yaml
│   ├── correctness.yaml
│   ├── architecture.yaml
│   ├── frontend.yaml
│   ├── performance-db.yaml
│   ├── performance-algorithmic.yaml
│   ├── performance-system.yaml
│   ├── concurrency.yaml
│   ├── observability.yaml
│   ├── simplicity.yaml
│   ├── maintainability.yaml
│   └── risk-patterns.yaml
├── prompts/                         # Review prompt templates
│   ├── base-reviewer.md
│   ├── strict-reviewer.md
│   └── lightweight-reviewer.md
├── adapters/                        # Agent integration files
│   ├── claude/redline-review.md
│   ├── copilot/redline-review.md
│   ├── codex/redline-review.md
│   ├── opencode/redline-review.md
│   └── antigravity/redline-review.md
├── schemas/
│   └── rule.schema.json             # JSON Schema for YAML rule validation
├── package.json
├── tsconfig.json
└── README.md
```

## Rule System

12 YAML files in `rules/`, each following `schemas/rule.schema.json`:

```yaml
category: authentication_authorization
severity_context: >
  Prioritize vulnerabilities enabling unauthorized access or privilege escalation.
rules:
  - id: missing_authorization_checks
    severity: critical
    detect: missing authorization checks on sensitive operations
    examples:
      - |
        adminDeletePost(postId)
```

Fields:
- **category** — human-readable category name
- **severity_context** — guidance for the reviewing agent on how to prioritize within this category
- **rules[].id** — unique snake_case identifier
- **rules[].severity** — `critical`, `high`, `medium`, or `low`
- **rules[].detect** — plain-English description of what to look for
- **rules[].examples** — optional anti-pattern code snippets

Categories: auth, correctness, architecture, frontend, performance-db, performance-algorithmic, performance-system, concurrency, observability, simplicity, maintainability, risk-patterns.

## Prompt Templates

Three variants in `prompts/`, selected via `--prompt`:

| Template | Flag | Behavior |
|---|---|---|
| `base-reviewer.md` | `--prompt base` (default) | All issues, grouped CRITICAL → HIGH → MEDIUM → LOW |
| `strict-reviewer.md` | `--prompt strict` | CRITICAL and HIGH only, with concrete fix suggestions |
| `lightweight-reviewer.md` | `--prompt lightweight` | Top 3 issues, one tight paragraph each |

All templates use `{{selectedRules}}` and `{{gitDiff}}` as substitution placeholders.

## Agent Adapters

Each adapter in `adapters/` is a markdown instruction file that tells the target agent how to invoke `redline-review` and use its output as the review task.

| Agent | Adapter path | Installation target |
|---|---|---|
| Claude Code | `adapters/claude/redline-review.md` | `.claude/commands/redline-review.md` |
| GitHub Copilot | `adapters/copilot/redline-review.md` | `.github/copilot-instructions.md` |
| Codex CLI | `adapters/codex/redline-review.md` | `AGENTS.md` |
| OpenCode | `adapters/opencode/redline-review.md` | `AGENTS.md` |
| Anti-gravity | `adapters/antigravity/redline-review.md` | Agent-specific config |

All adapters follow the same pattern: run the CLI, capture stdout, use the output as the review prompt.

## CLI Reference

```
redline-review [--stack <stacks>] [--type <types>] [--prompt <variant>] [--base <branch>]
```

| Flag | Description | Example |
|---|---|---|
| `--stack` | Comma-separated technology stacks | `--stack laravel,inertia` |
| `--type` | Comma-separated review focus areas | `--type auth,performance` |
| `--prompt` | Prompt template variant | `--prompt strict` |
| `--base` | Override base branch for diff | `--base origin/develop` |

When no flags are given, auto-detection scans the diff for domain keywords and selects rules automatically.

```bash
# Auto-detect everything
redline-review

# Explicit stack and type
redline-review --stack go --type backend,concurrency

# Strict review, custom base
redline-review --prompt strict --base main

# Pipe to clipboard
redline-review | pbcopy
```

## Build & Distribution

- **Build:** `npm run build` compiles `src/*.ts` → `dist/*.js` (ES2020 CommonJS, strict mode)
- **Prepare hook:** `npm run prepare` runs the build before publish
- **npm package ships:** `bin/`, `dist/`, `rules/`, `prompts/`, `schemas/`, `adapters/`, `README.md`
- **Excluded from npm:** `src/`, `tsconfig.json`, `agent-ctx_/`
- **Engine requirement:** Node >= 18
- **Single runtime dependency:** `js-yaml`
