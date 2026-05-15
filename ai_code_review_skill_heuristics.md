# AI Skill: Code Review Heuristics

## Simplicity & Clarity

- Detect redundant checking

```text
if x exists:
    if x is not null:
        process(x)
```

- Detect redundant normalization

```text
trim(lowercase(trim(value)))
```

- Detect redundant type casting/conversion

```text
toInt(parseInt(value))
```

- Detect verbose defensive programming

```text
if array exists:
    if length > 0:
        if first item exists:
```

- Detect nested if/else

```text
if a:
    if b:
        if c:
            execute()
```

- Detect chained ternaries beyond simple cases

```text
x = a ? b : c ? d : e ? f : g
```

- Detect large conditional chains that should use switch/match

```text
if type == 'A'
else if type == 'B'
else if type == 'C'
```

- Detect overly complex inline boolean conditions

```text
if a && b && !c && (d || e) && f:
```

- Detect unclear or non-intent-revealing naming

```text
processData2()
doThing()
handleStuff()
```

- Detect accidental complexity

```text
FactoryManagerResolverBuilder
```

Additional context: Keep implementations cognitively cheap. Optimize for readability and intent clarity.

---

## Correctness & Safety

Severity context: Prioritize correctness issues that can cause silent failures, corrupted state, unpredictable behavior, or production instability.

- [HIGH] Detect swallowed exceptions

- [HIGH] Detect hidden side effects

- [CRITICAL] Detect ambiguous failure states

- Detect unhandled custom exceptions

```text
raise PaymentError
```

- Detect swallowed exceptions

```text
try:
    riskyOperation()
catch:
    pass
```

- Detect ambiguous failure states

```text
return null
```

- Detect unreachable branches

```text
return result
log('done')
```

- Detect dead code

```text
unusedHelper()
unusedVariable
```

- Detect stale abstractions

```text
LegacyUserAdapter
OldPaymentService
```

- Detect hidden side effects

```text
calculateTotal()
    -> updates database
```

- Detect vague/non-actionable error messages

```text
"Something went wrong"
"Operation failed"
```

- Detect missing operational context in errors

```text
"Failed to process request"
```

- Detect inconsistent error message quality

```text
"Invalid input"
vs
"Email format is invalid"
```

- Detect leaked internal implementation details in errors

```text
SQLSTATE[23505]
NullReferenceException at line 842
```

- Detect user-hostile error wording

```text
"Bad request"
"Invalid"
```

- Detect absence of remediation guidance in recoverable errors

```text
"Upload failed"
```

Good error characteristics:

```text
"Email already exists"
"Payment retry limit exceeded"
"File size exceeds 10MB limit"
```

Bad error characteristics:

```text
"Unknown error"
"Something broke"
```



Additional context: Ensure failure handling is explicit and behavior remains predictable.

---

## Authentication & Authorization

Severity context: Prioritize vulnerabilities that can enable unauthorized access, privilege escalation, or exposure of sensitive data.

- [CRITICAL] Detect missing authorization checks

- [CRITICAL] Detect role/permission bypass opportunities

- [CRITICAL] Detect insecure direct object reference patterns

- [CRITICAL] Detect sensitive operations without ownership validation

- [HIGH] Detect inconsistent permission enforcement

- [HIGH] Detect hardcoded roles/permissions

- Detect missing authentication checks

```text
updateUserProfile(userId)
```

- Detect missing authorization checks

```text
adminDeletePost(postId)
```

- Detect role/permission bypass opportunities

```text
if isLoggedIn:
    allowDelete()
```

- Detect insecure direct object reference patterns

```text
GET /invoice/123
```

- Detect hardcoded roles/permissions

```text
if role == 'admin'
```

- Detect inconsistent permission enforcement

```text
API route protected
background job unprotected
```

- Detect sensitive operations without ownership validation

```text
updateOrder(orderId)
```

Additional context: Review all sensitive actions assuming hostile access patterns and privilege escalation attempts.

---

## Architecture & Design

Severity context: Prioritize architectural patterns that increase coupling, centralize instability, or create long-term maintenance bottlenecks.

- [HIGH] Detect God classes/services/components

- Detect God classes/services/components

- Detect responsibility leakage

- Enforce separation of concerns

- Keep modules cohesive

- Detect unnecessary abstractions

- Detect deviations from framework conventions

- Detect unclear architectural boundaries

Additional context: Optimize for maintainability, scalability, and low coupling.

---

## Frontend Heuristics

- Detect God frontend components
- Detect duplicated state
- Detect unnecessary derived state
- Detect excessive prop drilling
- Detect unnecessary third-party tooling usage
- Detect axios usage where Inertia client is more appropriate

Additional context: Frontend complexity compounds fast. Keep state and rendering flows isolated.

---

## Database Performance

Severity context: Prioritize database access patterns that can cause production degradation, scaling bottlenecks, or infrastructure overload.

- [HIGH] Detect N+1 queries in hot paths

- [HIGH] Detect unbounded queries

- Detect N+1 queries

- Detect unbounded queries

- Detect overfetching

- Detect missing pagination/chunking

- Detect repeated relationship loading

Additional context: Always review ORM-heavy code with scale assumptions in mind.

---

## Algorithmic Performance

- Detect nested loops
- Detect brute-force solutions
- Detect repeated scans/computations
- Detect bad time complexity
- Detect bad memory complexity
- Detect excessive allocations

Additional context: Estimate complexity mentally during review. Watch for O(n²) growth patterns.

---

## Distributed/System Performance

Severity context: Prioritize distributed communication patterns that increase latency, reduce throughput, or amplify cascading failures.

- [HIGH] Detect synchronous waterfalls

- [HIGH] Detect serialized I/O bottlenecks

- [HIGH] Detect excessive network roundtrips

- Detect missing Redis pipelining/batching opportunities

- Detect excessive network roundtrips

- Detect synchronous waterfalls

- Detect serialized I/O bottlenecks

Additional context: Latency compounds across distributed systems.

---

## Concurrency & Consistency

Severity context: Prioritize concurrency and consistency issues that can create corrupted state, duplicate execution, financial inconsistencies, or distributed coordination failures.

- [CRITICAL] Detect race condition opportunities

- [CRITICAL] Detect missing transaction boundaries

- [CRITICAL] Detect non-idempotent retry flows

- [HIGH] Detect distributed lock requirements

- [HIGH] Detect eventual consistency hazards

- [HIGH] Detect unsafe async ordering assumptions

- Detect race condition opportunities

```text
read balance
update balance
save balance
```

- Detect missing transaction boundaries

```text
createOrder()
chargeCard()
updateInventory()
```

- Detect non-idempotent retry flows

```text
retry payment()
```

- Detect distributed lock requirements

```text
multiple workers processing same job
```

- Detect shared mutable state access

```text
globalCache.value += 1
```

- Detect eventual consistency hazards

```text
write database
immediately read replica
```

- Detect unsafe async ordering assumptions

```text
sendEmail()
assume user saved
```

Additional context: Review concurrent and distributed flows assuming retries, duplication, delays, and parallel execution.

---

## Observability

Severity context: Prioritize observability gaps that make production incidents difficult to diagnose, trace, or recover from.

- [CRITICAL] Detect sensitive data leakage in logs

- [HIGH] Detect missing error logging

- [HIGH] Detect silent failures

- [HIGH] Detect missing tracing/correlation context

- Detect missing error logging

```text
catch error:
    return failed
```

- Detect missing operational metrics

```text
processLargeJob()
```

- Detect useless/non-actionable logs

```text
log('here')
```

- Detect sensitive data leakage in logs

```text
log(password)
log(authToken)
```

- Detect missing tracing/correlation context

```text
serviceA -> serviceB
```

- Detect silent failures

```text
catch error:
    pass
```

- Detect excessive logging noise

```text
log('loop iteration')
```

Additional context: Systems should be diagnosable under production failure conditions.

---

## Maintainability

- Detect poor naming
- Detect large methods/functions
- Detect implicit mutations
- Detect inconsistent conventions
- Detect future change friction

Additional context: Code should be easy to modify safely under pressure.

---

## Risk Pattern Heuristics

- Detect architectural landmines

```text
small helper suddenly used by every critical flow
```

- Detect operational footguns

```text
dangerous command callable without safeguards
```

- Detect hidden blast radius

```text
shared utility used across billing/auth/orders
```

- Detect sharp edges in APIs/interfaces

```text
function accepts nullable/unsafe combinations
```

- Detect dangerous defaults

```text
isProduction = false
skipAuth = true
```

- Detect fragile assumptions

```text
assume event ordering
assume single worker
```

- Detect single points of failure

```text
one service handles all orchestration
```

Additional context: Review systems assuming future misuse, scaling pressure, operator mistakes, and evolving complexity.

---

## Review Order

1. Correctness
2. Simplicity
3. Maintainability
4. Architecture
5. Performance
6. Framework consistency
7. Developer ergonomics

Additional context: Strong reviews focus on long-term system quality, not just passing functionality.

