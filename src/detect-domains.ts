const DOMAIN_MAP: Array<{ pattern: RegExp; file: string }> = [
  {
    // Auth: guards, policies, tokens, permission checks
    pattern: /\b(middleware|guard|policy|permission|role|token|session|jwt|oauth|login|logout|authenticate|authoriz|Gate::|Can::|@auth|sanctum|passport|allowlist|denylist|acl)\b/i,
    file: 'auth.yaml',
  },
  {
    // Concurrency: async coordination, locks, transactions, goroutines
    pattern: /\b(queue|retry|idempotent|mutex|goroutine|chan\b|sync\.|synchronized|ExecutorService|Thread\.|deadlock|race\s+condition|semaphore|CancellationToken|lock\(|Interlocked|volatile)\b|\btransaction\b/i,
    file: 'concurrency.yaml',
  },
  {
    // DB performance: ORM patterns, unbounded queries, N+1
    pattern: /(->with\(|->load\(|->whereHas\(|::all\(\)|\.getAll\(|findAll\(|paginate|\.chunk\(|N\+1|eager|lazy\s+load|SELECT\s+\*|GROUP\s+BY|@Query|EntityManager|JpaRepository|\.save\(|\.flush\()/i,
    file: 'performance-db.yaml',
  },
  {
    // System performance: network I/O, HTTP calls, parallelism
    pattern: /\b(fetch\(|axios\.|http\.get|http\.post|curl|gRPC|HttpClient|WebClient|RestTemplate|Promise\.all|Promise\.allSettled|parallel|pipeline|batch|roundtrip)\b/i,
    file: 'performance-system.yaml',
  },
  {
    // Observability: logging, tracing, metrics, error capture
    pattern: /\b(log\.|log\(|logger\.|Logger\.|trace\(|metric|monitor|Sentry|Datadog|NewRelic|Honeybadger|Rollbar|Bugsnag|dd\.|opentelemetry|tracing)\b/i,
    file: 'observability.yaml',
  },
  {
    // Simplicity: nested conditions, complex boolean logic
    pattern: /\bif\s*\(.*&&.*&&|\belse\s+if\b|\bswitch\s*\(|(\?\s*[^:]+\s*:\s*[^:]+\s*:\s*)|\bternary\b/i,
    file: 'simplicity.yaml',
  },
  {
    // Architecture: classes, services, repositories, DI patterns
    pattern: /\b(class\s+\w|interface\s+\w|abstract\s+class|implements\b|extends\b|@Service|@Repository|@Controller|@Component|@Injectable|ServiceProvider|DependencyInjection|namespace\s+App)\b/i,
    file: 'architecture.yaml',
  },
  {
    // Frontend: React/Vue/Svelte component patterns
    pattern: /\b(useState|useEffect|useCallback|useMemo|useRef|useContext|props\b|emit\(|<template>|<script\s+setup|defineComponent|createApp|svelte|\.svelte)\b|\.jsx\b|\.tsx\b/i,
    file: 'frontend.yaml',
  },
  {
    // Algorithmic performance: loops, sorting, brute-force patterns
    pattern: /\b(for\s*\(.*for\s*\(|forEach.*forEach|\.sort\(|\.filter\(.*\.filter\(|\.map\(.*\.map\(|O\(n\^2\)|nested\s+loop)\b/i,
    file: 'performance-algorithmic.yaml',
  },
  {
    // Risk: dangerous flags, production settings, admin ops
    pattern: /\b(skipAuth|bypassAuth|isProduction\s*=\s*false|dryRun\s*=\s*false|force\s*=\s*true|deleteAll|truncate|drop\s+table|TRUNCATE|sudo|runAsRoot|disable.*check)\b/i,
    file: 'risk-patterns.yaml',
  },
];

const FALLBACK_FILES = ['correctness.yaml', 'maintainability.yaml', 'risk-patterns.yaml'];

export function detectRelevantDomains(diff: string): string[] {
  const detected = new Set<string>();

  for (const { pattern, file } of DOMAIN_MAP) {
    if (pattern.test(diff)) {
      detected.add(file);
    }
  }

  return detected.size > 0 ? Array.from(detected) : FALLBACK_FILES;
}
