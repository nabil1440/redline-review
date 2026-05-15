#!/usr/bin/env node

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { execSync } from 'child_process';

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

function parseArgs(): { outputMode: 'review' | 'prompt'; apiKey: string | undefined } {
  const args = process.argv.slice(2);
  const outputMode = args.includes('--output') && args[args.indexOf('--output') + 1] === 'prompt'
    ? 'prompt'
    : 'review';
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return { outputMode, apiKey };
}

function getGitDiff(): string {
  const strategies = [
    'git diff main...HEAD',
    'git diff master...HEAD',
    'git diff HEAD~1',
    'git diff --cached',
  ];

  for (const cmd of strategies) {
    try {
      const result = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
      if (result.length > 0) return result;
    } catch {
      continue;
    }
  }

  process.stderr.write('No diff found. Make sure you are in a git repository with changes.\n');
  process.exit(1);
}

function loadRules(rulesDir: string): RuleFile[] {
  const files = fs.readdirSync(rulesDir).filter(f => f.endsWith('.yaml'));
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

async function runReview(prompt: string, apiKey: string): Promise<void> {
  const client = new Anthropic({ apiKey });

  process.stderr.write('Running redline-review...\n\n');

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: 'You are an expert code reviewer. Be direct, specific, and actionable.',
    messages: [{ role: 'user', content: prompt }],
  });

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      process.stdout.write(chunk.delta.text);
    }
  }

  process.stdout.write('\n');
}

async function main(): Promise<void> {
  const { outputMode, apiKey } = parseArgs();

  const rulesDir = path.join(__dirname, '..', 'rules');
  const promptPath = path.join(__dirname, '..', 'prompts', 'base-reviewer.md');

  const ruleFiles = loadRules(rulesDir);
  const diff = getGitDiff();
  const promptTemplate = fs.readFileSync(promptPath, 'utf8');
  const rulesText = formatRulesForPrompt(ruleFiles);
  const finalPrompt = buildPrompt(rulesText, diff, promptTemplate);

  if (outputMode === 'prompt') {
    process.stdout.write(finalPrompt + '\n');
    return;
  }

  if (!apiKey) {
    process.stderr.write('Error: ANTHROPIC_API_KEY environment variable is required.\n');
    process.stderr.write('Set it with: export ANTHROPIC_API_KEY=your-key\n');
    process.stderr.write('Or use --output prompt to get the assembled prompt without calling the API.\n');
    process.exit(1);
  }

  await runReview(finalPrompt, apiKey);
}

main().catch(err => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exit(1);
});
