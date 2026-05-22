import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ENTRY_POINT_PATTERNS = /^(main|index|app|server|entrypoint|bootstrap|startup)\./i;
const ORCHESTRATION_PATTERNS = /\b(runtime|scheduler|worker|queue|dispatcher|processor)\b/i;
const MIGRATION_PATTERNS = /\bmigrations?\b/i;
const CONFIG_BASENAMES = new Set([
  'dockerfile', 'docker-compose.yml', 'docker-compose.yaml',
  'makefile', 'justfile', 'taskfile.yml',
  '.env.example', '.env.sample',
]);
const CONFIG_EXTENSIONS = new Set(['.tf', '.toml', '.ini']);

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp', '.bmp',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar',
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.mp3', '.mp4', '.avi', '.mov', '.wav',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.pyc', '.class', '.o', '.obj',
]);

const ORIENTATION_FILES = [
  'package.json', 'go.mod', 'Cargo.toml', 'pyproject.toml',
  'Gemfile', 'pom.xml', 'build.gradle', 'composer.json',
  'Makefile', 'justfile', 'Taskfile.yml',
  'tsconfig.json',
];

const MAX_INLINE_SIZE = 2048;
const MAX_README_SIZE = 2048;

function isBinary(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

function getTag(filePath: string, basename: string): string | null {
  if (ENTRY_POINT_PATTERNS.test(basename)) return 'entry-point';
  if (MIGRATION_PATTERNS.test(filePath)) return 'migration';
  if (ORCHESTRATION_PATTERNS.test(basename)) return 'orchestration';
  if (CONFIG_BASENAMES.has(basename.toLowerCase())) return 'config';
  if (CONFIG_EXTENSIONS.has(path.extname(filePath).toLowerCase())) return 'config';
  if (basename.toLowerCase().startsWith('config') || basename.toLowerCase().startsWith('settings')) return 'config';
  return null;
}

function getLineCount(filePath: string): number {
  try {
    const output = execSync(`wc -l < "${filePath}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    return parseInt(output, 10) || 0;
  } catch {
    return 0;
  }
}

export interface ManifestResult {
  tree: string;
  orientationContent: string;
  fileCount: number;
  truncated: boolean;
}

export function buildManifest(maxDepth: number = 10): ManifestResult {
  let files: string[];
  try {
    const output = execSync('git ls-files',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    files = output ? output.split('\n') : [];
  } catch {
    return { tree: '(no tracked files)', orientationContent: '', fileCount: 0, truncated: false };
  }

  const nonBinary = files.filter(f => !isBinary(f));

  // Compute largest files (top 10 by line count)
  const fileSizes: Array<{ file: string; lines: number }> = [];
  for (const f of nonBinary.slice(0, 500)) {
    const lines = getLineCount(f);
    if (lines > 0) fileSizes.push({ file: f, lines });
  }
  fileSizes.sort((a, b) => b.lines - a.lines);
  const largestFiles = new Set(fileSizes.slice(0, 10).map(f => f.file));
  const largestMap = new Map(fileSizes.slice(0, 10).map(f => [f.file, f.lines]));

  // Build annotated tree
  let truncated = false;
  const treeLines: string[] = [];

  for (const f of nonBinary) {
    const depth = f.split('/').length - 1;
    if (depth > maxDepth) {
      truncated = true;
      continue;
    }

    const basename = path.basename(f);
    const tag = getTag(f, basename);
    const isLargest = largestFiles.has(f);

    let annotation = '';
    if (tag) annotation += `  [${tag}]`;
    if (isLargest) annotation += `  (${largestMap.get(f)} lines) [largest]`;

    treeLines.push(f + annotation);
  }

  if (truncated) {
    const truncCount = nonBinary.filter(f => f.split('/').length - 1 > maxDepth).length;
    treeLines.push(`... (${truncCount} files beyond depth ${maxDepth} truncated)`);
  }

  // Inline orientation files
  const orientationParts: string[] = [];

  for (const name of ORIENTATION_FILES) {
    if (!files.includes(name)) continue;
    try {
      const content = fs.readFileSync(name, 'utf8');
      if (content.length <= MAX_INLINE_SIZE) {
        orientationParts.push(`### ${name}\n\`\`\`\n${content.trimEnd()}\n\`\`\``);
      } else {
        orientationParts.push(`### ${name}\n\`\`\`\n${content.slice(0, MAX_INLINE_SIZE).trimEnd()}\n... (truncated)\n\`\`\``);
      }
    } catch { continue; }
  }

  // Inline README (first 2KB)
  const readmeFile = files.find(f => /^readme\.md$/i.test(f));
  if (readmeFile) {
    try {
      const content = fs.readFileSync(readmeFile, 'utf8');
      const trimmed = content.slice(0, MAX_README_SIZE).trimEnd();
      orientationParts.push(`### ${readmeFile}\n${trimmed}${content.length > MAX_README_SIZE ? '\n... (truncated)' : ''}`);
    } catch { /* skip */ }
  }

  // Inline CI workflows (truncated)
  const ciFiles = files.filter(f => f.startsWith('.github/workflows/') && f.endsWith('.yml'));
  for (const f of ciFiles.slice(0, 3)) {
    try {
      const content = fs.readFileSync(f, 'utf8');
      const trimmed = content.slice(0, 1024).trimEnd();
      orientationParts.push(`### ${f}\n\`\`\`yaml\n${trimmed}${content.length > 1024 ? '\n... (truncated)' : ''}\n\`\`\``);
    } catch { continue; }
  }

  return {
    tree: treeLines.join('\n'),
    orientationContent: orientationParts.join('\n\n'),
    fileCount: files.length,
    truncated,
  };
}
