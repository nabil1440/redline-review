# redline-review

Run `redline-review` (or `npx redline-review` if not globally installed) in the current project root.

The CLI will assemble a focused code review prompt from the current git diff and your installed rule set, then print it to stdout.

**Take that output and use it as your task.** Perform the code review inline based on the prompt content.

No API key required. No external calls are made by the CLI.

## Example flow

```
User: /redline-review
Agent: runs `redline-review`, receives assembled prompt, performs review
```

## Flags (Phase 2+)

```bash
redline-review --stack laravel,inertia --type auth,performance
redline-review --prompt strict
```
