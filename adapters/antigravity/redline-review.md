# redline-review — Anti-gravity adapter

## Setup

```bash
npm install -g redline-review
```

## Usage

Run the CLI in your project root:

```bash
redline-review
```

Anti-gravity will receive the assembled review prompt. Use it as the task instructions for the code review.

## Focused reviews

```bash
redline-review --type auth,performance
redline-review --stack laravel,inertia --type backend,auth
redline-review --prompt strict        # CRITICAL/HIGH severity only
redline-review --prompt lightweight   # top 3 issues, quick scan
```

## One-shot (no global install)

```bash
npx redline-review
```
