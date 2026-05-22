import { execSync } from 'child_process';
import { ReviewInput } from './redline-review';
import { buildManifest } from './manifest';
import { detectRepoStacks } from './detect-repo-stacks';

function getFlag(argv: string[], flag: string): string | undefined {
  const idx = argv.indexOf(flag);
  return idx !== -1 ? argv[idx + 1] : undefined;
}

function detectPrimaryLanguages(): string[] {
  let files: string[];
  try {
    const output = execSync('git ls-files',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    files = output ? output.split('\n') : [];
  } catch {
    return [];
  }

  const extCounts = new Map<string, number>();
  const extLabels: Record<string, string> = {
    '.ts': 'TypeScript', '.tsx': 'TypeScript', '.js': 'JavaScript', '.jsx': 'JavaScript',
    '.py': 'Python', '.go': 'Go', '.rb': 'Ruby', '.java': 'Java', '.cs': 'C#',
    '.php': 'PHP', '.rs': 'Rust', '.swift': 'Swift', '.kt': 'Kotlin',
    '.vue': 'Vue', '.svelte': 'Svelte', '.cpp': 'C++', '.c': 'C',
  };

  for (const f of files) {
    const dot = f.lastIndexOf('.');
    if (dot === -1) continue;
    const ext = f.slice(dot).toLowerCase();
    if (extLabels[ext]) {
      const label = extLabels[ext];
      extCounts.set(label, (extCounts.get(label) ?? 0) + 1);
    }
  }

  return Array.from(extCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label]) => label);
}

export function collectRepoInput(argv: string[]): ReviewInput {
  const maxDepth = parseInt(getFlag(argv, '--max-tree-depth') ?? '10', 10);

  process.stderr.write('Building repo manifest...\n');

  const manifest = buildManifest(maxDepth);
  const languages = detectPrimaryLanguages();

  process.stderr.write(`${manifest.fileCount} tracked files.`);
  if (languages.length) process.stderr.write(` Primary: ${languages.join(', ')}.`);
  if (manifest.truncated) process.stderr.write(' (tree truncated)');
  process.stderr.write('\n');

  let reviewContent = `## File Tree\n\n\`\`\`\n${manifest.tree}\n\`\`\`\n`;
  if (manifest.orientationContent) {
    reviewContent += `\n## Orientation Files\n\n${manifest.orientationContent}\n`;
  }

  return {
    mode: 'repo',
    reviewContent,
    metadata: {
      fileCount: manifest.fileCount,
      primaryLanguages: languages,
      truncated: manifest.truncated,
    },
  };
}

export function getRepoRuleFiles(argv: string[]): string[] | undefined {
  const hasStack = argv.includes('--stack');
  const hasType = argv.includes('--type');
  if (hasStack || hasType) return undefined;
  return detectRepoStacks();
}
