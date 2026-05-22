import { execSync } from 'child_process';
import { buildReviewContext } from './build-context';

const EXTENSION_STACK_MAP: Record<string, string> = {
  '.go': 'go',
  '.tsx': 'react',
  '.jsx': 'react',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.rb': 'rails',
  '.java': 'java',
  '.cs': 'csharp',
  '.py': 'django',
  '.php': 'laravel',
};

const FALLBACK_FILES = ['correctness.yaml', 'maintainability.yaml', 'risk-patterns.yaml'];

export function detectRepoStacks(): string[] {
  let files: string[];
  try {
    const output = execSync('git ls-files',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    files = output ? output.split('\n') : [];
  } catch {
    return FALLBACK_FILES;
  }

  const extCounts = new Map<string, number>();
  for (const f of files) {
    const dot = f.lastIndexOf('.');
    if (dot === -1) continue;
    const ext = f.slice(dot).toLowerCase();
    extCounts.set(ext, (extCounts.get(ext) ?? 0) + 1);
  }

  const stacks = new Set<string>();
  for (const [ext, count] of extCounts) {
    if (count < 2) continue;
    const stack = EXTENSION_STACK_MAP[ext];
    if (stack) stacks.add(stack);
  }

  // Detect Node.js projects by package.json presence
  if (files.includes('package.json') && !stacks.has('react')) {
    stacks.add('node');
  }

  if (stacks.size === 0) return FALLBACK_FILES;

  const result = buildReviewContext({ stack: Array.from(stacks) });
  return result.length > 0 ? result : FALLBACK_FILES;
}
