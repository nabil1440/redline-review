# Recommended Plan

Convert the markdown into:

```text
structured rule files
```

Probably:

```text
YAML
```

because:

- human editable
- LLM friendly
- composable
- diffable
- easy to load in TS/JS/Python

---

# Recommended Folder Structure

```text
review-skill/
├── rules/
│   ├── simplicity.yaml
│   ├── correctness.yaml
│   ├── auth.yaml
│   ├── architecture.yaml
│   ├── performance-db.yaml
│   ├── performance-system.yaml
│   ├── concurrency.yaml
│   ├── observability.yaml
│   └── maintainability.yaml
│
├── prompts/
│   ├── base-reviewer.md
│   ├── strict-reviewer.md
│   └── lightweight-reviewer.md
│
├── schemas/
│   └── rule.schema.json
│
├── scripts/
│   ├── build-context.ts
│   └── review-pr.ts
│
├── package.json
└── README.md
```

---

# Your Immediate Workflow

## Step 1 — Download/Copy Rules

Take the markdown and split each section into YAML. (already done)

Example:

```yaml
category: authentication_authorization

severity_context: >
  Prioritize vulnerabilities that can enable unauthorized access,
  privilege escalation, or exposure of sensitive data.

rules:
  - id: missing_authorization_checks
    severity: critical
    detect: missing authorization checks

    examples:
      - |
        adminDeletePost(postId)

  - id: idor_patterns
    severity: critical
    detect: insecure direct object reference patterns

    examples:
      - |
        GET /invoice/123
```

---

# Step 2 — Build Context Selector

THIS is the important part.

You do NOT want:

```text
inject every heuristic always
```

That destroys context quality.

Instead:

```ts
buildReviewContext({
  stack: ['laravel', 'inertia'],
  reviewType: ['backend', 'auth', 'performance']
});
```

returns:

```text
- auth.yaml
- correctness.yaml
- performance-db.yaml
```

Now your AI receives:

- focused expertise
- smaller prompts
- higher signal density

This is the correct architecture.

---

# Step 3 — Generate Final Prompt

Example:

```ts
const finalPrompt = `
You are an expert code reviewer.

Focus areas:
${selectedRules}

Review this diff:
${gitDiff}
`;
```

Now you have:

```text
diff + specialized cognition
```

instead of:

```text
diff + giant bloated prompt soup
```

Massive difference.

---

# Step 4 — Hook Into Git

Simple version:

```bash
git diff main...HEAD
```

Then pass that into:

- OpenAI API
- Claude API
- local models
- Cursor agent
- Codex

---

# Step 5 — Optional Rule Filtering

This is where it gets powerful.

Example:

```ts
detectRelevantDomains(diff);
```

If diff contains:

- middleware
- guards
- policies
- auth routes

inject:

```text
auth.yaml
```

If diff contains:

- queues
- jobs
- retries
- async
- locks

inject:

```text
concurrency.yaml
```

Now your reviewer becomes:

```text
context-adaptive
```

instead of:

```text
generic AI code monkey
```
