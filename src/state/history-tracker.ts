import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createGitProcessEnv } from "../core/git-process-env";
import { getRuntimeHomePath, getWorkspaceDirectoryPath } from "./workspace-state";

const HISTORY_DIR = "history";

let historyDisabled = false;

function logError(msg: string): void {
	process.stderr.write(`${msg}\n`);
}

function getHistoryRepoPath(workspaceId: string): string {
	return join(getRuntimeHomePath(), HISTORY_DIR, workspaceId);
}

function runGit(cwd: string, args: string[]): { ok: boolean; stdout: string; stderr: string } {
	const result = spawnSync("git", args, {
		cwd,
		env: createGitProcessEnv(),
		encoding: "utf-8",
		timeout: 10_000,
	});
	return {
		ok: result.status === 0,
		stdout: (result.stdout ?? "").trim(),
		stderr: (result.stderr ?? "").trim(),
	};
}

function ensureHistoryRepoSync(workspaceId: string): string | null {
	if (historyDisabled) return null;

	const repoPath = getHistoryRepoPath(workspaceId);
	try {
		if (!existsSync(join(repoPath, ".git"))) {
			mkdirSync(repoPath, { recursive: true });
			const init = runGit(repoPath, ["init"]);
			if (!init.ok) {
				logError(`[history] Failed to init history repo: ${init.stderr}`);
				historyDisabled = true;
				return null;
			}
			runGit(repoPath, ["config", "user.name", "kanban-history"]);
			runGit(repoPath, ["config", "user.email", "kanban@local"]);
			runGit(repoPath, ["commit", "--allow-empty", "-m", "[kanban] init history tracking"]);
		}
		return repoPath;
	} catch (err) {
		logError(`[history] Failed to ensure history repo: ${err}`);
		historyDisabled = true;
		return null;
	}
}

export function commitHistorySnapshot(workspaceId: string, message: string): void {
	if (historyDisabled) return;

	try {
		const repoPath = ensureHistoryRepoSync(workspaceId);
		if (!repoPath) return;

		const workspacePath = getWorkspaceDirectoryPath(workspaceId);

		for (const filename of ["board.json", "sessions.json", "meta.json"]) {
			const src = join(workspacePath, filename);
			if (existsSync(src)) {
				copyFileSync(src, join(repoPath, filename));
			}
		}

		const add = runGit(repoPath, ["add", "-A"]);
		if (!add.ok) {
			logError(`[history] git add failed: ${add.stderr}`);
			return;
		}

		const commit = runGit(repoPath, ["commit", "-m", `[kanban] ${message}`]);
		if (!commit.ok && !commit.stdout.includes("nothing to commit")) {
			logError(`[history] git commit failed: ${commit.stderr}`);
		}
	} catch (err) {
		logError(`[history] Failed to commit snapshot: ${err}`);
	}
}

export interface HistoryEntry {
	hash: string;
	date: string;
	message: string;
}

export function getHistoryLog(workspaceId: string, limit: number = 20): HistoryEntry[] {
	const repoPath = ensureHistoryRepoSync(workspaceId);
	if (!repoPath) return [];

	const result = runGit(repoPath, ["log", `-${limit}`, "--format=%H\t%aI\t%s"]);
	if (!result.ok) return [];

	return result.stdout
		.split("\n")
		.filter((line) => line.length > 0)
		.map((line) => {
			const [hash, date, ...messageParts] = line.split("\t");
			return { hash, date, message: messageParts.join("\t") };
		});
}

export function getHistorySnapshot(
	workspaceId: string,
	commitHash: string,
	filename: string = "board.json",
): string | null {
	const repoPath = ensureHistoryRepoSync(workspaceId);
	if (!repoPath) return null;

	const result = runGit(repoPath, ["show", `${commitHash}:${filename}`]);
	if (!result.ok) return null;
	return result.stdout;
}
