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

## Range review

Review changes between two commits or tags:

```bash
redline-review range --from <ref> --to <ref>
redline-review range --from v1.0.0 --to v1.1.0 --prompt strict
```

## Commit walk

Step through commits one at a time. Run `--start`, review the output, then `--next` to advance:

```bash
redline-review walk --start                       # begin
redline-review walk --next                        # advance
redline-review walk --status                      # check progress
redline-review walk --reset                       # clear state
redline-review walk --start --interval 2          # batch commits
redline-review walk --start --direction forwards  # walk oldest → newest
```

## Repo review

Full repository audit. Output is a manifest — use file-reading tools to explore as instructed:

```bash
redline-review repo
redline-review repo --max-tree-depth 3
```

## Integration tip

Add to your project's `AGENTS.md` or OpenCode instructions:

```markdown
When asked to review code, run `redline-review` first and use the output as your review criteria.
```
