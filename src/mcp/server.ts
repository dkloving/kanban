import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import packageJson from "../../package.json" with { type: "json" };
import {
	createTask,
	deleteTaskCommand,
	getTask,
	linkTasks,
	listTasks,
	trashTask,
	unlinkTasks,
	updateTaskCommand,
} from "../commands/task.js";

const KANBAN_VERSION = typeof packageJson.version === "string" ? packageJson.version : "0.1.0";

const COLUMN_VALUES = ["backlog", "in_progress", "review", "trash"] as const;

function createJsonToolResult(payload: unknown): { content: Array<{ type: "text"; text: string }> } {
	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(payload, null, 2),
			},
		],
	};
}

function createToolError(error: unknown): { content: Array<{ type: "text"; text: string }>; isError: true } {
	const message = error instanceof Error ? error.message : String(error);
	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify({ ok: false, error: message }, null, 2),
			},
		],
		isError: true,
	};
}

export function createKanbanMcpServer(cwd: string): McpServer {
	const server = new McpServer(
		{ name: "kanban", version: KANBAN_VERSION },
		{
			instructions:
				"Kanban board management server. Use these tools to create, update, start, trash, delete, and link tasks on a Kanban board. A running Kanban server is required.",
		},
	);

	server.registerTool(
		"list_tasks",
		{
			title: "List tasks",
			description:
				"List all tasks on the Kanban board. By default excludes trashed tasks unless the trash column is explicitly requested.",
			inputSchema: {
				projectPath: z
					.string()
					.optional()
					.describe("Project workspace path. Defaults to the server's working directory."),
				column: z
					.enum(COLUMN_VALUES)
					.optional()
					.describe("Filter to a specific column: backlog, in_progress, review, or trash."),
			},
		},
		async (args) => {
			try {
				const result = await listTasks({
					cwd,
					projectPath: args.projectPath,
					column: args.column,
				});
				return createJsonToolResult(result);
			} catch (error) {
				return createToolError(error);
			}
		},
	);

	server.registerTool(
		"get_task",
		{
			title: "Get task",
			description:
				"Get a single task by ID with its full details and dependencies. Use this to look up tasks referenced with # in other task prompts.",
			inputSchema: {
				taskId: z.string().min(1).describe("The ID of the task to look up."),
				projectPath: z
					.string()
					.optional()
					.describe("Project workspace path. Defaults to the server's working directory."),
			},
		},
		async (args) => {
			try {
				const result = await getTask({
					cwd,
					taskId: args.taskId,
					projectPath: args.projectPath,
				});
				return createJsonToolResult(result);
			} catch (error) {
				return createToolError(error);
			}
		},
	);

	server.registerTool(
		"create_task",
		{
			title: "Create task",
			description: "Create a new task in the backlog column.",
			inputSchema: {
				prompt: z.string().min(1).describe("The task description/prompt."),
				projectPath: z
					.string()
					.optional()
					.describe("Project workspace path. Defaults to the server's working directory."),
				baseRef: z.string().optional().describe("Git branch to base the task's worktree on."),
				startInPlanMode: z.boolean().optional().describe("Whether the agent should start in plan mode."),
			},
		},
		async (args) => {
			try {
				const result = await createTask({
					cwd,
					prompt: args.prompt,
					projectPath: args.projectPath,
					baseRef: args.baseRef,
					startInPlanMode: args.startInPlanMode,
				});
				return createJsonToolResult(result);
			} catch (error) {
				return createToolError(error);
			}
		},
	);

	server.registerTool(
		"update_task",
		{
			title: "Update task",
			description: "Update an existing task's properties. At least one field besides taskId must be provided.",
			inputSchema: {
				taskId: z.string().min(1).describe("The ID of the task to update."),
				projectPath: z
					.string()
					.optional()
					.describe("Project workspace path. Defaults to the server's working directory."),
				prompt: z.string().optional().describe("Replacement task description/prompt."),
				baseRef: z.string().optional().describe("Replacement base git branch."),
				startInPlanMode: z.boolean().optional().describe("Whether the agent should start in plan mode."),
			},
		},
		async (args) => {
			try {
				const result = await updateTaskCommand({
					cwd,
					taskId: args.taskId,
					projectPath: args.projectPath,
					prompt: args.prompt,
					baseRef: args.baseRef,
					startInPlanMode: args.startInPlanMode,
				});
				return createJsonToolResult(result);
			} catch (error) {
				return createToolError(error);
			}
		},
	);

	server.registerTool(
		"trash_task",
		{
			title: "Trash task",
			description:
				"Move a task or all tasks in a column to trash. Stops running sessions, deletes worktrees, and auto-starts linked backlog tasks that become ready. Provide either taskId or column, not both.",
			inputSchema: {
				taskId: z.string().optional().describe("The ID of a specific task to trash."),
				column: z
					.enum(COLUMN_VALUES)
					.optional()
					.describe("Trash all tasks in this column: backlog, in_progress, review, or trash."),
				projectPath: z
					.string()
					.optional()
					.describe("Project workspace path. Defaults to the server's working directory."),
			},
		},
		async (args) => {
			try {
				const result = await trashTask({
					cwd,
					taskId: args.taskId,
					column: args.column,
					projectPath: args.projectPath,
				});
				return createJsonToolResult(result);
			} catch (error) {
				return createToolError(error);
			}
		},
	);

	server.registerTool(
		"delete_task",
		{
			title: "Delete task",
			description:
				"Permanently delete a task or all tasks in a column. This cannot be undone. Provide either taskId or column, not both.",
			inputSchema: {
				taskId: z.string().optional().describe("The ID of a specific task to delete."),
				column: z
					.enum(COLUMN_VALUES)
					.optional()
					.describe("Delete all tasks in this column: backlog, in_progress, review, or trash."),
				projectPath: z
					.string()
					.optional()
					.describe("Project workspace path. Defaults to the server's working directory."),
			},
		},
		async (args) => {
			try {
				const result = await deleteTaskCommand({
					cwd,
					taskId: args.taskId,
					column: args.column,
					projectPath: args.projectPath,
				});
				return createJsonToolResult(result);
			} catch (error) {
				return createToolError(error);
			}
		},
	);

	server.registerTool(
		"link_tasks",
		{
			title: "Link tasks",
			description:
				"Create a dependency between two tasks. At least one must be in backlog. The backlog task will wait until the other task finishes before it can start.",
			inputSchema: {
				taskId: z.string().min(1).describe("One of the two task IDs to link."),
				linkedTaskId: z.string().min(1).describe("The other task ID to link."),
				projectPath: z
					.string()
					.optional()
					.describe("Project workspace path. Defaults to the server's working directory."),
			},
		},
		async (args) => {
			try {
				const result = await linkTasks({
					cwd,
					taskId: args.taskId,
					linkedTaskId: args.linkedTaskId,
					projectPath: args.projectPath,
				});
				return createJsonToolResult(result);
			} catch (error) {
				return createToolError(error);
			}
		},
	);

	server.registerTool(
		"unlink_tasks",
		{
			title: "Unlink tasks",
			description: "Remove an existing dependency link between two tasks.",
			inputSchema: {
				dependencyId: z.string().min(1).describe("The dependency ID to remove."),
				projectPath: z
					.string()
					.optional()
					.describe("Project workspace path. Defaults to the server's working directory."),
			},
		},
		async (args) => {
			try {
				const result = await unlinkTasks({
					cwd,
					dependencyId: args.dependencyId,
					projectPath: args.projectPath,
				});
				return createJsonToolResult(result);
			} catch (error) {
				return createToolError(error);
			}
		},
	);

	return server;
}

export async function runKanbanMcpServer(cwd: string): Promise<void> {
	const server = createKanbanMcpServer(cwd);
	const transport = new StdioServerTransport();
	await server.connect(transport);
}
