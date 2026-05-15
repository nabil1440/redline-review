# redline-review — OpenCode adapter

## Setup

```bash
npm install -g redline-review
```

## Usage in OpenCode

Run the CLI as a shell command within your OpenCode session:

```bash
redline-review
```

OpenCode will receive the assembled review prompt as output. Use it as the basis for your review task.

## Focused reviews

```bash
redline-review --type auth,performance
redline-review --stack laravel,inertia --type backend
redline-review --prompt strict
redline-review --prompt lightweight
```

## Integration tip

Add to your project's `AGENTS.md` or OpenCode instructions:

```markdown
When asked to review code, run `redline-review` first and use the output as your review criteria.
```
