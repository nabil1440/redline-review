# redline-review — GitHub Copilot adapter

## Setup

```bash
npm install -g redline-review
```

## Usage with GitHub Copilot (VS Code)

Add to `.github/copilot-instructions.md` in your project:

```markdown
## Code Review Instructions

When asked to review code or a PR, first run this command in the terminal:

```bash
redline-review
```

Take the full output and treat it as your review instructions. Perform the review based on the rules and diff provided.
```

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

Step through commits one at a time. After each step, perform the review from the output, then run `--next` to continue:

```bash
redline-review walk --start                       # begin
redline-review walk --next                        # advance
redline-review walk --status                      # check progress
redline-review walk --reset                       # clear state
redline-review walk --start --interval 2          # batch commits
redline-review walk --start --direction forwards  # walk oldest → newest
```

## Repo review

Full repository audit. Output is a manifest — use file-reading tools to explore the codebase as instructed:

```bash
redline-review repo
redline-review repo --max-tree-depth 3
```

## Workspace instructions path

`.github/copilot-instructions.md` is loaded automatically by Copilot in VS Code for workspace-level context.
