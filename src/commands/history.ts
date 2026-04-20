import type { Command } from "commander";
import { getHistoryLog, getHistorySnapshot } from "../state/history-tracker";
import { loadWorkspaceContext } from "../state/workspace-state";

function printJson(payload: unknown): void {
	process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function printError(payload: unknown): void {
	process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
}

async function resolveWorkspaceId(projectPath: string | undefined): Promise<string> {
	const cwd = process.cwd();
	const workspacePath = projectPath ?? cwd;
	const context = await loadWorkspaceContext(workspacePath);
	return context.workspaceId;
}

export function registerHistoryCommand(program: Command): void {
	const history = program.command("history").description("Browse and restore Kanban board history.");

	history
		.command("log")
		.description("Show recent board mutations.")
		.option("--project-path <path>", "Workspace path. Defaults to current directory.")
		.option("--limit <n>", "Number of entries to show.", "20")
		.action(async (options: { projectPath?: string; limit: string }) => {
			try {
				const workspaceId = await resolveWorkspaceId(options.projectPath);
				const entries = getHistoryLog(workspaceId, parseInt(options.limit, 10));
				if (entries.length === 0) {
					printJson({ ok: true, entries: [], message: "No history found." });
					return;
				}
				printJson({ ok: true, entries });
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				printError({ ok: false, error: message });
				process.exitCode = 1;
			}
		});

	history
		.command("show <commit>")
		.description("Show the board state at a specific commit.")
		.option("--project-path <path>", "Workspace path. Defaults to current directory.")
		.option("--file <name>", "File to show: board.json, sessions.json, or meta.json.", "board.json")
		.action(async (commit: string, options: { projectPath?: string; file: string }) => {
			try {
				const workspaceId = await resolveWorkspaceId(options.projectPath);
				const content = getHistorySnapshot(workspaceId, commit, options.file);
				if (content === null) {
					printError({ ok: false, error: `Could not retrieve ${options.file} at ${commit}` });
					process.exitCode = 1;
					return;
				}
				process.stdout.write(`${content}\n`);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				printError({ ok: false, error: message });
				process.exitCode = 1;
			}
		});

	history
		.command("restore <commit>")
		.description("Restore the board state from a specific commit. Requires --confirm.")
		.option("--project-path <path>", "Workspace path. Defaults to current directory.")
		.requiredOption("--confirm", "Confirm the restore operation.")
		.action(async (commit: string, options: { projectPath?: string; confirm: boolean }) => {
			try {
				const workspaceId = await resolveWorkspaceId(options.projectPath);
				const boardContent = getHistorySnapshot(workspaceId, commit, "board.json");
				const sessionsContent = getHistorySnapshot(workspaceId, commit, "sessions.json");
				const metaContent = getHistorySnapshot(workspaceId, commit, "meta.json");

				if (!boardContent) {
					printError({ ok: false, error: `Could not retrieve board.json at ${commit}` });
					process.exitCode = 1;
					return;
				}

				const { lockedFileSystem } = await import("../fs/locked-file-system");
				const { getWorkspaceDirectoryPath } = await import("../state/workspace-state");
				const { join } = await import("node:path");
				const { commitHistorySnapshot } = await import("../state/history-tracker");

				const workspacePath = getWorkspaceDirectoryPath(workspaceId);

				const board = JSON.parse(boardContent);
				await lockedFileSystem.writeJsonFileAtomic(join(workspacePath, "board.json"), board, { lock: null });

				if (sessionsContent) {
					const sessions = JSON.parse(sessionsContent);
					await lockedFileSystem.writeJsonFileAtomic(join(workspacePath, "sessions.json"), sessions, {
						lock: null,
					});
				}

				if (metaContent) {
					const meta = JSON.parse(metaContent);
					meta.revision = (meta.revision ?? 0) + 1;
					meta.updatedAt = Date.now();
					await lockedFileSystem.writeJsonFileAtomic(join(workspacePath, "meta.json"), meta, { lock: null });
				}

				commitHistorySnapshot(workspaceId, `restore: from ${commit.slice(0, 8)}`);

				const taskCount =
					board.columns?.reduce((sum: number, col: { cards: unknown[] }) => sum + col.cards.length, 0) ??
					"unknown";
				printJson({
					ok: true,
					message: `Restored board state from ${commit.slice(0, 8)} (${taskCount} tasks).`,
					restoredFrom: commit,
				});
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				printError({ ok: false, error: message });
				process.exitCode = 1;
			}
		});
}
