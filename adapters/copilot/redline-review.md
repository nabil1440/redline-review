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

In the Copilot Chat panel, ask it to run:

```bash
redline-review --type auth,performance
redline-review --stack laravel,inertia --type backend
redline-review --prompt strict
redline-review --prompt lightweight
```

## Workspace instructions path

`.github/copilot-instructions.md` is loaded automatically by Copilot in VS Code for workspace-level context.
