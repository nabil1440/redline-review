# redline-review

Run `redline-review` (or `npx redline-review` if not globally installed) in the current project root.

The tool will:
1. Detect the git diff automatically
2. Load the appropriate review rules
3. Return a structured code review grouped by severity

Present the output as-is — it is already formatted for readability.

## Agent-mode (no API key needed)

If you want to run the review yourself rather than delegating to the CLI's LLM call, use:

```bash
redline-review --output prompt
```

This returns the fully assembled review prompt. Pass it as your user message to perform the review inline.
