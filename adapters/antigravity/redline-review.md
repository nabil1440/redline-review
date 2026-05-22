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
