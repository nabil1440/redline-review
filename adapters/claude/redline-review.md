# redline-review

Run `redline-review` (or `npx redline-review` if not globally installed) in the current project root.

The CLI assembles a focused code review prompt from the git diff and the installed rule set, then prints it to stdout.

**Take that output and use it as your task.** Perform the code review based on the prompt content.

## Install

```bash
npm install -g redline-review
```

## Usage

```bash
# All rules (default)
redline-review

# Focused by review type
redline-review --type auth,performance

# Focused by stack
redline-review --stack laravel,inertia --type backend,auth

# Strict mode (CRITICAL/HIGH only)
redline-review --prompt strict

# Quick scan (top 3 issues)
redline-review --prompt lightweight
```

## How to use as a Claude Code skill

Place this file at `.claude/commands/redline-review.md` in your project.
Then invoke it with `/redline-review` in Claude Code.
