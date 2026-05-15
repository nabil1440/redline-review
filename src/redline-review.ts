#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';
import { execSync } from 'child_process';
import { buildReviewContext } from './build-context';
import { detectRelevantDomains } from './detect-domains';

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

interface ParsedArgs {
  stack?: string[];
  reviewType?: string[];
  promptVariant: string;
  base?: string;
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);

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

function getGitDiff(baseOverride?: string): string {
  const baseCandidates: string[] = baseOverride
    ? [baseOverride]
    : ([detectBaseBranch(), 'main', 'master', 'develop', 'trunk'].filter(Boolean) as string[]);

  for (const base of baseCandidates) {
    try {
      const result = execSync(`git diff ${base}...HEAD`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
      if (result.length > 0) {
        process.stderr.write(`Base branch: ${base}\n`);
        return result;
      }
    } catch { continue; }
  }

  for (const cmd of ['git diff HEAD~1', 'git diff --cached']) {
    try {
      const result = execSync(cmd,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
      if (result.length > 0) {
        process.stderr.write(`Warning: could not find a base branch; falling back to \`${cmd}\`\n`);
        return result;
      }
    } catch { continue; }
  }

  process.stderr.write('No diff found. Make sure you are in a git repository with changes.\n');
  process.exit(1);
}

function loadRules(rulesDir: string, selectedFiles?: string[]): RuleFile[] {
  const files = fs.readdirSync(rulesDir)
    .filter(f => f.endsWith('.yaml'))
    .filter(f => !selectedFiles || selectedFiles.includes(f));

  return files.map(file => {
    const content = fs.readFileSync(path.join(rulesDir, file), 'utf8');
    return yaml.load(content) as RuleFile;
  });
}

function formatRulesForPrompt(ruleFiles: RuleFile[]): string {
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

function buildPrompt(rulesText: string, diff: string, promptTemplate: string): string {
  return promptTemplate
    .replace('{{selectedRules}}', rulesText)
    .replace('{{gitDiff}}', diff);
}

function resolvePromptPath(variant: string, promptsDir: string): string {
  const map: Record<string, string> = {
    base:        'base-reviewer.md',
    strict:      'strict-reviewer.md',
    lightweight: 'lightweight-reviewer.md',
  };
  const file = map[variant] ?? 'base-reviewer.md';
  return path.join(promptsDir, file);
}

function main(): void {
  process.stdout.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EPIPE') process.exit(0);
  });

  const { stack, reviewType, promptVariant, base } = parseArgs();
  const rulesDir = path.join(__dirname, '..', 'rules');
  const promptsDir = path.join(__dirname, '..', 'prompts');

  const diff = getGitDiff(base);

  let selectedFiles: string[] | undefined;
  let contextSource: string;

  if (reviewType || stack) {
    selectedFiles = buildReviewContext({ stack, reviewType });
    if (selectedFiles.length === 0) {
      process.stderr.write('Warning: no matching rules for the given --stack/--type. Falling back to all rules.\n');
      selectedFiles = undefined;
    }
    contextSource = 'explicit';
  } else {
    selectedFiles = detectRelevantDomains(diff);
    contextSource = 'auto-detected';
  }

  const ruleFiles = loadRules(rulesDir, selectedFiles?.length ? selectedFiles : undefined);
  const promptPath = resolvePromptPath(promptVariant, promptsDir);
  const promptTemplate = fs.readFileSync(promptPath, 'utf8');
  const rulesText = formatRulesForPrompt(ruleFiles);
  const finalPrompt = buildPrompt(rulesText, diff, promptTemplate);

  if (selectedFiles?.length) {
    process.stderr.write(`Domains (${contextSource}): ${selectedFiles.join(', ')}\n`);
  }

  process.stdout.write(finalPrompt + '\n');
}

main();
