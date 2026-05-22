import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export interface WalkState {
  version: 1;
  createdAt: string;
  headAtStart: string;
  commits: string[];
  interval: number;
  direction: 'backwards' | 'forwards';
  position: number;
  flags: { stack?: string; type?: string; prompt?: string };
}

export function getStatePath(): string {
  const gitDir = execSync('git rev-parse --git-dir',
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  return path.join(gitDir, 'redline-walk.json');
}

export function readState(): WalkState | null {
  const statePath = getStatePath();
  if (!fs.existsSync(statePath)) return null;
  const raw = fs.readFileSync(statePath, 'utf8');
  return JSON.parse(raw) as WalkState;
}

export function writeState(state: WalkState): void {
  fs.writeFileSync(getStatePath(), JSON.stringify(state, null, 2) + '\n');
}

export function clearState(): void {
  const statePath = getStatePath();
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
}
