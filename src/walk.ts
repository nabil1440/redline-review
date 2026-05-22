import { execSync } from 'child_process';
import { ReviewInput, getGitDiff } from './redline-review';
import { WalkState, readState, writeState, clearState } from './walk-state';

function detectBaseBranch(): string | null {
  try {
    return execSync('git rev-parse --abbrev-ref @{upstream}',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch { /* no upstream */ }

  try {
    const ref = execSync('git symbolic-ref refs/remotes/origin/HEAD',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    return ref.replace('refs/remotes/', '');
  } catch { /* no remote HEAD */ }

  for (const name of ['main', 'master', 'develop', 'trunk']) {
    try {
      execSync(`git rev-parse --verify ${name}`,
        { stdio: ['pipe', 'pipe', 'pipe'] });
      return name;
    } catch { continue; }
  }
  return null;
}

function getFlag(argv: string[], flag: string): string | undefined {
  const idx = argv.indexOf(flag);
  return idx !== -1 ? argv[idx + 1] : undefined;
}

function hasFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag);
}

function computeStepCount(commitCount: number, interval: number): number {
  return Math.ceil(commitCount / interval);
}

function computeStepPair(
  state: WalkState,
  stepIndex: number
): { pairFrom: string; pairTo: string } {
  const { commits, interval, direction } = state;
  const totalSteps = computeStepCount(commits.length, interval);

  // Effective step index: direction controls which end we start from
  const effectiveStep = direction === 'backwards'
    ? totalSteps - 1 - stepIndex
    : stepIndex;

  const startIdx = effectiveStep * interval;
  const endIdx = Math.min(startIdx + interval, commits.length) - 1;

  const pairTo = commits[endIdx];
  let pairFrom: string;

  if (startIdx === 0) {
    // First commit in range — use its parent or empty tree for root commits
    try {
      pairFrom = execSync(`git rev-parse ${commits[0]}^`,
        { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch {
      // Root commit with no parent — use empty tree
      pairFrom = '4b825dc642cb6eb9a060e54bf899d15f71f7b9e3';
    }
  } else {
    pairFrom = commits[startIdx - 1];
  }

  return { pairFrom, pairTo };
}

function emitStep(state: WalkState): ReviewInput {
  const totalSteps = computeStepCount(state.commits.length, state.interval);
  const stepIndex = state.position;
  const { pairFrom, pairTo } = computeStepPair(state, stepIndex);

  const diff = getGitDiff({ from: pairFrom, to: pairTo, threeDot: true });

  let commitMessage: string;
  try {
    commitMessage = execSync(`git log --format=%s -1 ${pairTo}`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    commitMessage = '(unknown)';
  }

  process.stderr.write(
    `Step ${stepIndex + 1} of ${totalSteps}:  ${pairFrom.slice(0, 7)}...${pairTo.slice(0, 7)}   "${commitMessage}"\n`
  );

  state.position = stepIndex + 1;
  writeState(state);

  return {
    mode: 'walk',
    reviewContent: diff,
    metadata: {
      step: stepIndex,
      total: totalSteps,
      pairFrom: pairFrom.slice(0, 7),
      pairTo: pairTo.slice(0, 7),
      commitMessage,
    },
  };
}

export function runWalkStart(argv: string[]): ReviewInput {
  const existing = readState();
  if (existing && !hasFlag(argv, '--force')) {
    const total = computeStepCount(existing.commits.length, existing.interval);
    process.stderr.write(
      `Walk already in progress at step ${existing.position} of ${total}. Use --reset or --force.\n`
    );
    process.exit(1);
  }

  const fromRef = getFlag(argv, '--from') ?? detectBaseBranch();
  if (!fromRef) {
    process.stderr.write('Error: could not detect base branch. Use --from to specify.\n');
    process.exit(1);
  }
  const toRef = getFlag(argv, '--to') ?? 'HEAD';
  const interval = parseInt(getFlag(argv, '--interval') ?? '1', 10);
  const direction = (getFlag(argv, '--direction') ?? 'backwards') as 'backwards' | 'forwards';

  let commits: string[];
  try {
    const output = execSync(`git rev-list --reverse ${fromRef}..${toRef}`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    commits = output ? output.split('\n') : [];
  } catch {
    process.stderr.write(`Error: could not list commits between ${fromRef} and ${toRef}.\n`);
    process.exit(1);
  }

  if (commits.length === 0) {
    process.stderr.write(`No commits to walk between ${fromRef} and ${toRef}.\n`);
    process.exit(0);
  }

  const headSha = execSync('git rev-parse HEAD',
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();

  const totalSteps = computeStepCount(commits.length, interval);
  process.stderr.write(
    `Detected ${commits.length} commits between ${fromRef} and ${toRef}.\n` +
    `Walking ${direction} from ${direction === 'backwards' ? 'HEAD' : fromRef}, interval=${interval}.\n`
  );

  const state: WalkState = {
    version: 1,
    createdAt: new Date().toISOString(),
    headAtStart: headSha,
    commits,
    interval,
    direction,
    position: 0,
    flags: {
      stack: getFlag(argv, '--stack'),
      type: getFlag(argv, '--type'),
      prompt: getFlag(argv, '--prompt'),
    },
  };

  writeState(state);
  return emitStep(state);
}

export function runWalkNext(): ReviewInput {
  const state = readState();
  if (!state) {
    process.stderr.write("No walk in progress. Run 'redline-review walk --start' first.\n");
    process.exit(1);
  }

  const totalSteps = computeStepCount(state.commits.length, state.interval);
  if (state.position >= totalSteps) {
    process.stderr.write('Walk complete. Use --reset to start a new one.\n');
    process.exit(0);
  }

  // Warn if HEAD has moved since walk started
  try {
    const currentHead = execSync('git rev-parse HEAD',
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    if (currentHead !== state.headAtStart) {
      process.stderr.write('Warning: HEAD has moved since walk started. Commit list is still valid.\n');
    }
  } catch { /* ignore */ }

  return emitStep(state);
}

export function runWalkStatus(): null {
  const state = readState();
  if (!state) {
    process.stderr.write('No walk in progress.\n');
    process.exit(0);
  }

  const totalSteps = computeStepCount(state.commits.length, state.interval);
  const remaining = totalSteps - state.position;

  let nextPairStr = '(walk complete)';
  if (state.position < totalSteps) {
    const { pairFrom, pairTo } = computeStepPair(state, state.position);
    nextPairStr = `${pairFrom.slice(0, 7)}...${pairTo.slice(0, 7)}`;
  }

  const flagParts: string[] = [];
  if (state.flags.stack) flagParts.push(`--stack ${state.flags.stack}`);
  if (state.flags.type) flagParts.push(`--type ${state.flags.type}`);
  if (state.flags.prompt) flagParts.push(`--prompt ${state.flags.prompt}`);

  process.stderr.write(
    `Walk in progress.\n` +
    `  Commits:   ${state.commits.length}\n` +
    `  Direction: ${state.direction}\n` +
    `  Interval:  ${state.interval}\n` +
    `  Progress:  step ${state.position} of ${totalSteps}  (${remaining} remaining)\n` +
    `  Next pair: ${nextPairStr}\n` +
    (flagParts.length ? `  Flags:     ${flagParts.join(' ')}\n` : '')
  );

  return null;
}

export function runWalkReset(): null {
  clearState();
  process.stderr.write('Walk state cleared.\n');
  return null;
}
