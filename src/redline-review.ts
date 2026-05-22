#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';
import { execSync } from 'child_process';
import { buildReviewContext } from './build-context';
import { detectRelevantDomains } from './detect-domains';
import { collectRangeInput } from './range';
import { runWalkStart, runWalkNext, runWalkStatus, runWalkReset } from './walk';
import { collectRepoInput, getRepoRuleFiles } from './repo';

interface Rule {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detect: string;
  examples?: string[];
}

interface RuleFile {
  category: string;
  severity_context?: string;
  rules: Rule[];
}

export interface ReviewInput {
  mode: 'branch' | 'range' | 'walk' | 'repo';
  reviewContent: string;
  metadata?: Record<string, unknown>;
}

export interface ParsedArgs {
  stack?: string[];
  reviewType?: string[];
  promptVariant: string;
  base?: string;
}

export function parseArgs(argv: string[] = process.argv): ParsedArgs {
  const args = argv.slice(2);

  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const stack = get('--stack')?.split(',').filter(Boolean);
  const reviewType = get('--type')?.split(',').filter(Boolean);
  const promptVariant = get('--prompt') ?? 'base';
  const base = get('--base');

  return { stack, reviewType, promptVariant, base };
}

function detectBaseBranch(): string | null {
  try {
    return execSync('git rev-parse --abbrev-ref @{upstream}',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch { /* no upstream configured */ }

  try {
    const ref = execSync('git symbolic-ref refs/remotes/origin/HEAD',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    return ref.replace('refs/remotes/', '');
  } catch { /* no remote HEAD ref */ }

  return null;
}

export function getGitDiff(opts: { from: string; to: string; threeDot?: boolean }): string {
  const separator = opts.threeDot !== false ? '...' : '..';
  const cmd = `git diff ${opts.from}${separator}${opts.to}`;
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
}

function getBranchDiff(baseOverride?: string): { diff: string; base: string } {
  const baseCandidates: string[] = baseOverride
    ? [baseOverride]
    : ([detectBaseBranch(), 'main', 'master', 'develop', 'trunk'].filter(Boolean) as string[]);

  for (const base of baseCandidates) {
    const result = getGitDiff({ from: base, to: 'HEAD', threeDot: true });
    if (result.length > 0) {
      process.stderr.write(`Base branch: ${base}\n`);
      return { diff: result, base };
    }
  }

  for (const cmd of ['git diff HEAD~1', 'git diff --cached']) {
    try {
      const result = execSync(cmd,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
      if (result.length > 0) {
        process.stderr.write(`Warning: could not find a base branch; falling back to \`${cmd}\`\n`);
        return { diff: result, base: cmd };
      }
    } catch { continue; }
  }

  process.stderr.write('No diff found. Make sure you are in a git repository with changes.\n');
  process.exit(1);
}

export function loadRules(rulesDir: string, selectedFiles?: string[]): RuleFile[] {
  const files = fs.readdirSync(rulesDir)
    .filter(f => f.endsWith('.yaml'))
    .filter(f => !selectedFiles || selectedFiles.includes(f));

  return files.map(file => {
    const content = fs.readFileSync(path.join(rulesDir, file), 'utf8');
    return yaml.load(content) as RuleFile;
  });
}

export function formatRulesForPrompt(ruleFiles: RuleFile[]): string {
  return ruleFiles.map(rf => {
    const header = `### ${rf.category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
    const context = rf.severity_context ? `\n*${rf.severity_context.trim()}*\n` : '';
    const rules = rf.rules.map(r => {
      const examples = r.examples && r.examples.length > 0
        ? `\n  Example:\n${r.examples[0].split('\n').map(l => `    ${l}`).join('\n')}`
        : '';
      return `- [${r.severity.toUpperCase()}] ${r.detect}${examples}`;
    }).join('\n');
    return `${header}${context}\n${rules}`;
  }).join('\n\n');
}

export function renderContext(mode: ReviewInput['mode'], metadata?: Record<string, unknown>): string {
  switch (mode) {
    case 'branch': {
      const base = metadata?.base as string | undefined;
      return base ? `\n## Review Mode\n\nBranch diff against \`${base}\`.\n` : '';
    }
    case 'range': {
      const from = metadata?.from as string;
      const to = metadata?.to as string;
      return `\n## Review Mode\n\nRange review: \`${from}\` → \`${to}\`.\n`;
    }
    case 'walk': {
      const step = metadata?.step as number;
      const total = metadata?.total as number;
      const msg = metadata?.commitMessage as string;
      const pairFrom = metadata?.pairFrom as string;
      const pairTo = metadata?.pairTo as string;
      return `\n## Review Mode\n\nCommit walk — step ${step + 1} of ${total}.\nCommit: \`${pairFrom}...${pairTo}\`\nMessage: ${msg}\n`;
    }
    case 'repo': {
      const fileCount = metadata?.fileCount as number;
      const langs = metadata?.primaryLanguages as string[] | undefined;
      const truncated = metadata?.truncated as boolean;
      let ctx = `\n## Review Mode\n\nFull repository review. ${fileCount} tracked files.`;
      if (langs?.length) ctx += ` Primary languages: ${langs.join(', ')}.`;
      if (truncated) ctx += ' (file tree truncated)';
      return ctx + '\n';
    }
    default:
      return '';
  }
}

export function buildPrompt(template: string, input: ReviewInput, selectedRules: string): string {
  const contextBlock = renderContext(input.mode, input.metadata);
  return template
    .replace('{{reviewContext}}', contextBlock)
    .replace('{{selectedRules}}', selectedRules)
    .replace('{{reviewData}}', input.reviewContent);
}

export function resolvePromptPath(variant: string, promptsDir: string, mode?: ReviewInput['mode']): string {
  const map: Record<string, string> = {
    base:        'base-reviewer.md',
    strict:      'strict-reviewer.md',
    lightweight: 'lightweight-reviewer.md',
    repo:        'repo-reviewer.md',
  };
  const file = map[variant] ?? (mode === 'repo' ? 'repo-reviewer.md' : 'base-reviewer.md');
  return path.join(promptsDir, file);
}

export function runPipeline(input: ReviewInput, args: ParsedArgs, preSelectedFiles?: string[]): void {
  const rulesDir = path.join(__dirname, '..', 'rules');
  const promptsDir = path.join(__dirname, '..', 'prompts');

  let selectedFiles: string[] | undefined;
  let contextSource: string;

  if (preSelectedFiles) {
    selectedFiles = preSelectedFiles;
    contextSource = 'repo-detected';
  } else if (args.reviewType || args.stack) {
    selectedFiles = buildReviewContext({ stack: args.stack, reviewType: args.reviewType });
    if (selectedFiles.length === 0) {
      process.stderr.write('Warning: no matching rules for the given --stack/--type. Falling back to all rules.\n');
      selectedFiles = undefined;
    }
    contextSource = 'explicit';
  } else {
    selectedFiles = detectRelevantDomains(input.reviewContent);
    contextSource = 'auto-detected';
  }

  const ruleFiles = loadRules(rulesDir, selectedFiles?.length ? selectedFiles : undefined);
  const promptVariant = input.mode === 'repo' && args.promptVariant === 'base' ? 'repo' : args.promptVariant;
  const promptPath = resolvePromptPath(promptVariant, promptsDir, input.mode);
  const promptTemplate = fs.readFileSync(promptPath, 'utf8');
  const rulesText = formatRulesForPrompt(ruleFiles);
  const finalPrompt = buildPrompt(promptTemplate, input, rulesText);

  if (selectedFiles?.length) {
    process.stderr.write(`Domains (${contextSource}): ${selectedFiles.join(', ')}\n`);
  }

  process.stdout.write(finalPrompt + '\n');
}

function runDefault(args: ParsedArgs): void {
  const { diff, base } = getBranchDiff(args.base);
  const input: ReviewInput = {
    mode: 'branch',
    reviewContent: diff,
    metadata: { base },
  };
  runPipeline(input, args);
}

function main(): void {
  process.stdout.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EPIPE') process.exit(0);
  });

  const sub = process.argv[2];

  const args = parseArgs();

  switch (sub) {
    case 'range': {
      const input = collectRangeInput(process.argv.slice(3));
      runPipeline(input, args);
      break;
    }
    case 'walk': {
      const walkArgv = process.argv.slice(3);
      let input: ReviewInput | null = null;

      if (walkArgv.includes('--start')) {
        input = runWalkStart(walkArgv);
      } else if (walkArgv.includes('--next')) {
        input = runWalkNext();
      } else if (walkArgv.includes('--status')) {
        runWalkStatus();
      } else if (walkArgv.includes('--reset')) {
        runWalkReset();
      } else {
        process.stderr.write('Error: walk requires one of --start, --next, --status, or --reset.\n');
        process.exit(1);
      }

      if (input) {
        runPipeline(input, args);
      }
      break;
    }
    case 'repo': {
      const repoArgv = process.argv.slice(3);
      const repoInput = collectRepoInput(repoArgv);
      const repoRuleFiles = getRepoRuleFiles(repoArgv);
      runPipeline(repoInput, args, repoRuleFiles);
      break;
    }
    default:
      runDefault(args);
      break;
  }
}

main();
