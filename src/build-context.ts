export interface ReviewContext {
  stack?: string[];
  reviewType?: string[];
}

const REVIEW_TYPE_MAP: Record<string, string[]> = {
  auth:         ['auth.yaml', 'correctness.yaml'],
  security:     ['auth.yaml', 'correctness.yaml', 'risk-patterns.yaml'],
  performance:  ['performance-db.yaml', 'performance-system.yaml', 'performance-algorithmic.yaml'],
  backend:      ['correctness.yaml', 'concurrency.yaml', 'observability.yaml'],
  frontend:     ['frontend.yaml', 'simplicity.yaml'],
  architecture: ['architecture.yaml', 'maintainability.yaml'],
  concurrency:  ['concurrency.yaml', 'correctness.yaml'],
  observability:['observability.yaml', 'correctness.yaml'],
  risk:         ['risk-patterns.yaml', 'architecture.yaml'],
};

const STACK_MAP: Record<string, string[]> = {
  laravel: ['architecture.yaml', 'performance-db.yaml'],
  inertia: ['frontend.yaml', 'architecture.yaml'],
  react:   ['frontend.yaml'],
  vue:     ['frontend.yaml'],
  svelte:  ['frontend.yaml'],
  node:    ['concurrency.yaml', 'performance-system.yaml'],
  django:  ['architecture.yaml', 'performance-db.yaml'],
  rails:   ['architecture.yaml', 'performance-db.yaml'],
};

export function buildReviewContext(context: ReviewContext): string[] {
  const files = new Set<string>();

  if (context.reviewType && context.reviewType.length > 0) {
    for (const type of context.reviewType) {
      const mapped = REVIEW_TYPE_MAP[type.toLowerCase().trim()];
      if (mapped) mapped.forEach(f => files.add(f));
    }
  }

  if (context.stack && context.stack.length > 0) {
    for (const s of context.stack) {
      const mapped = STACK_MAP[s.toLowerCase().trim()];
      if (mapped) mapped.forEach(f => files.add(f));
    }
  }

  return Array.from(files);
}
