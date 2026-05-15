# redline-review — Codex adapter

## Setup

```bash
npm install -g redline-review
```

## Usage with Codex CLI

Add to your project's `AGENTS.md`:

```markdown
## Code Review

When performing a code review, always run `redline-review` first:

```bash
redline-review
```

Use the output as your review instructions. Do not perform the review without it.
```

## Focused reviews

```bash
redline-review --type auth,performance
redline-review --stack laravel --type backend,auth
redline-review --prompt strict        # CRITICAL/HIGH only
redline-review --prompt lightweight   # top 3 issues
```

## One-shot (no global install)

```bash
npx redline-review
```
