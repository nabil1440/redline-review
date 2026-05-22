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

## One-shot (no global install)

```bash
npx redline-review
```
