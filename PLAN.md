# Plan: Adaptive AI Code Review Skill — redline-review

## Context

Source files:
- `ai_code_review_skill_heuristics.md` — 11 review rule categories (Simplicity, Correctness, Auth, Architecture, Frontend, DB Perf, Algo Perf, Distributed Perf, Concurrency, Observability, Maintainability, Risk Patterns)
- `GOAL.md` — architecture: YAML rules, context selector, focused prompts, git diff hook, auto domain detection

**Goal:** An npm-published CLI (`redline-review`) that:
1. Works locally with a global install (`npm i -g redline-review`)
2. Ships thin agent adapter files for Claude Code, OpenCode, Codex, Copilot, and others
3. Can be run standalone (calls LLM API) or output-only mode (for agent use)
4. Is publishable to npm as `redline-review`

---

## Setup — Git Repo & Branch

```bash
git init
git add GOAL.md ai_code_review_skill_heuristics.md
git commit -m "chore: initial project files"
git checkout -b develop
```

All work on `develop`. Conventional commit prefixes:
- `feat:` new capability
- `chore:` scaffolding, config, tooling
- `docs:` README, comments
- `refactor:` restructuring without behavior change
- `fix:` bug fixes

---

## Phase 1 — Core CLI Package (Globally Installable)

**Deliverable:** `npm i -g redline-review` works. Running `redline-review` in any git repo produces a full code review.

### Package structure

```
redline-review/
├── src/
│   └── redline-review.ts     # CLI entry: diff → rules → prompt → LLM → review
├── rules/
│   ├── simplicity.yaml
│   ├── correctness.yaml
│   ├── auth.yaml
│   ├── architecture.yaml
│   ├── frontend.yaml
│   ├── performance-db.yaml
│   ├── performance-algorithmic.yaml
│   ├── performance-system.yaml
│   ├── concurrency.yaml
│   ├── observability.yaml
│   ├── maintainability.yaml
│   └── risk-patterns.yaml
├── prompts/
│   └── base-reviewer.md
├── schemas/
│   └── rule.schema.json
├── adapters/
│   └── claude/
│       └── redline-review.md
├── bin/
│   └── redline-review
├── package.json
├── tsconfig.json
└── README.md
```

### Usage (Phase 1)
```bash
npm i -g redline-review
cd any-git-project
redline-review                  # full review via Claude API
redline-review --output prompt  # print assembled prompt only
```

---

## Phase 2 — Context-Aware + Multi-Agent Adapters

**Deliverable:** `redline-review --stack laravel --type auth,performance` sends only relevant rules. Adapter files ship for Claude, OpenCode, Codex, Copilot, Anti-gravity.

### New: `src/build-context.ts`
```ts
buildReviewContext({ stack: ['laravel'], reviewType: ['auth', 'performance'] })
// returns: ['auth.yaml', 'correctness.yaml', 'performance-db.yaml']
```

**Mapping:**
| reviewType | rule files |
|---|---|
| `auth` | `auth.yaml`, `correctness.yaml` |
| `performance` | `performance-db.yaml`, `performance-system.yaml`, `performance-algorithmic.yaml` |
| `backend` | `correctness.yaml`, `concurrency.yaml`, `observability.yaml` |
| `frontend` | `frontend.yaml`, `simplicity.yaml` |
| `architecture` | `architecture.yaml`, `maintainability.yaml` |
| (none) | all files |

### Agent adapters
| Agent | Adapter path |
|---|---|
| Claude Code | `adapters/claude/redline-review.md` |
| OpenCode | `adapters/opencode/redline-review.md` |
| Codex CLI | `adapters/codex/redline-review.md` |
| GitHub Copilot | `adapters/copilot/redline-review.md` |
| Anti-gravity | `adapters/antigravity/redline-review.md` |

### Updated CLI flags
```bash
redline-review --stack laravel,inertia --type auth,performance
redline-review --prompt strict
redline-review --output prompt
```

---

## Phase 3 — Auto-Adaptive + npm Publish

**Deliverable:** Zero-arg `redline-review` auto-detects domains from diff content. Published to npm.

### New: `src/detect-domains.ts`
```ts
detectRelevantDomains(diff: string): string[]
```

**Keyword map:**
| Keywords in diff | Inject |
|---|---|
| `middleware`, `guard`, `policy`, `auth`, `permission`, `role`, `token` | `auth.yaml` |
| `queue`, `job`, `retry`, `transaction`, `lock`, `idempotent` | `concurrency.yaml` |
| `->with(`, `->load(`, `paginate`, `chunk`, `query` | `performance-db.yaml` |
| `await`, `Promise.all`, `fetch`, `http.get`, `curl`, `gRPC` | `performance-system.yaml` |
| `log(`, `logger`, `trace`, `metric`, `catch` | `observability.yaml` |
| `if (`, `else if`, `switch`, nested conditions | `simplicity.yaml` |
| `class`, `service`, `repository`, `interface`, `abstract` | `architecture.yaml` |
| `component`, `useState`, `useEffect`, `props`, `jsx`, `tsx` | `frontend.yaml` |

Fallback: `correctness.yaml` + `maintainability.yaml` + `risk-patterns.yaml`

### npm publish
```bash
npm publish --access public
```

---

## Verification

**Phase 1:**
```bash
npm install && npm run build && npm link
cd /some/other/git/project
redline-review
redline-review --output prompt
```

**Phase 2:**
```bash
redline-review --stack laravel --type auth,performance
```

**Phase 3:**
```bash
redline-review
# stderr: "Detected domains: auth, concurrency"
npm publish --dry-run
```
