import { execSync } from 'child_process';
import { ReviewInput, getGitDiff } from './redline-review';

function resolveRef(ref: string): string {
  try {
    return execSync(`git rev-parse --verify ${ref}^{commit}`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    process.stderr.write(`Error: "${ref}" is not a valid commit reference.\n`);
    process.exit(1);
  }
}

export function collectRangeInput(argv: string[]): ReviewInput {
  const get = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag);
    return idx !== -1 ? argv[idx + 1] : undefined;
  };

  const fromRef = get('--from');
  if (!fromRef) {
    process.stderr.write('Error: --from is required for range review.\n');
    process.exit(1);
  }
  const toRef = get('--to') ?? 'HEAD';

  const fromSha = resolveRef(fromRef);
  const toSha = resolveRef(toRef);

  const diff = getGitDiff({ from: fromSha, to: toSha, threeDot: true });

  if (diff.length === 0) {
    process.stderr.write(`No changes between ${fromRef} and ${toRef}.\n`);
    process.exit(0);
  }

  // Warn if --to is an ancestor of --from (args may be swapped)
  try {
    const isAncestor = execSync(`git merge-base --is-ancestor ${toSha} ${fromSha}`,
      { stdio: ['pipe', 'pipe', 'pipe'] });
    // If the command succeeds (exit 0), toSha is ancestor of fromSha
    process.stderr.write(`Warning: "${toRef}" is an ancestor of "${fromRef}" — did you swap the arguments?\n`);
  } catch {
    // Not an ancestor — expected path, no warning needed
  }

  process.stderr.write(`Range: ${fromRef} (${fromSha.slice(0, 7)}) → ${toRef} (${toSha.slice(0, 7)})\n`);

  return {
    mode: 'range',
    reviewContent: diff,
    metadata: { from: fromRef, to: toRef },
  };
}
