# redline-review

Run `redline-review` (or `npx redline-review` if not globally installed) in the current project root.

The CLI assembles a focused code review prompt from the git diff and the installed rule set, then prints it to stdout.

**Take that output and use it as your task.** Perform the code review based on the prompt content.

## Install

```bash
npm install -g redline-review
```

## Branch diff (default)

```bash
# Auto-detect base branch
redline-review

# Pin the base branch explicitly
redline-review --base origin/develop

# Focused by review type
redline-review --type auth,performance

# Focused by stack
redline-review --stack laravel,inertia --type backend,auth

# Strict mode (CRITICAL/HIGH only)
redline-review --prompt strict

# Quick scan (top 3 issues)
redline-review --prompt lightweight
```

## Range review

Review changes between two specific commits or tags.

```bash
redline-review range --from <ref> --to <ref>
redline-review range --from v1.0.0 --to v1.1.0
redline-review range --from HEAD~5 --to HEAD --prompt strict
```

`--to` defaults to HEAD if omitted.

## Commit walk

Step through commits one at a time.

```bash
redline-review walk --start
redline-review walk --next
redline-review walk --status
redline-review walk --reset
```

**Interactive flow:**

1. Run `redline-review walk --start` and capture stdout.
2. Perform the review described by that prompt.
3. Present findings to the user, then ask: "Continue to the next commit?"
4. If the user confirms, run `redline-review walk --next` and repeat from step 2.
5. If the user declines, stop. State persists — they can resume later with `--next`.
6. When walk is complete (`--next` exits with no stdout), tell the user.

Optional flags for `--start`:

```bash
redline-review walk --start --interval 2              # batch 2 commits per step
redline-review walk --start --direction forwards       # walk oldest → newest
redline-review walk --start --from v1.0.0 --to v2.0.0 # explicit range
redline-review walk --start --force                    # overwrite in-progress walk
```

Flags `--stack`, `--type`, and `--prompt` passed at `--start` time are captured and reused for every `--next`.

## Repo review

Full repository architecture audit. The output is a manifest with an annotated file tree and orientation files — use your file-reading tools to explore the codebase as instructed by the prompt.

```bash
redline-review repo
redline-review repo --max-tree-depth 3
redline-review repo --stack go --type architecture
```

## How to use as a Claude Code skill

Place this file at `.claude/commands/redline-review.md` in your project (or `~/.claude/commands/redline-review.md` for global access).
Then invoke it with `/redline-review` in Claude Code.
