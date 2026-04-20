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
	openTask,
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
				"List tasks on the Kanban board. Defaults to backlog column only. Use brief=true (recommended) to get just task IDs and first-line summaries. Use get_task or open_task with a task ID to read the full prompt.",
			inputSchema: {
				projectPath: z
					.string()
					.optional()
					.describe("Project workspace path. Defaults to the server's working directory."),
				column: z
					.enum(COLUMN_VALUES)
					.optional()
					.describe("Filter to a specific column: backlog, in_progress, review, or trash."),
				brief: z
					.boolean()
					.optional()
					.describe(
						"If true, return only task ID and first line of prompt. Much smaller output — recommended for initial listing.",
					),
			},
		},
		async (args) => {
			try {
				const result = await listTasks({
					cwd,
					projectPath: args.projectPath,
					column: args.column,
					brief: args.brief,
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
				"Get a single task by ID with its full untruncated prompt and dependencies. Read-only — does NOT return a context_id. If you intend to update the task, use open_task instead.",
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
		"open_task",
		{
			title: "Open task for editing",
			description:
				"Open a task for editing. Returns the full prompt and a context_id. You MUST call open_task before calling update_task — the update_task tool requires the context_id returned here. Workflow: open_task → read the response → pass the context_id to update_task. If someone else modified the task after you opened it, update_task will reject your change and you must open_task again.",
			inputSchema: {
				taskId: z.string().min(1).describe("The ID of the task to open."),
				projectPath: z
					.string()
					.optional()
					.describe("Project workspace path. Defaults to the server's working directory."),
			},
		},
		async (args) => {
			try {
				const result = await openTask({
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
			description:
				"Update an existing task's prompt or properties. REQUIRED WORKFLOW: First call open_task to get the context_id, then pass it here. update_task will fail without a valid context_id. If the task was modified since you opened it, the update will be rejected — call open_task again to get a fresh context_id.",
			inputSchema: {
				taskId: z.string().min(1).describe("The ID of the task to update."),
				contextId: z
					.string()
					.min(1)
					.describe("Context ID from open_task. Required to prove you read the current content before updating."),
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
					contextId: args.contextId,
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
