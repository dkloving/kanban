# Phase 01 Plan: ACP Kanban Shell

## Goal
Ship a working Kanban webview that can start a task through ACP and show progress on the board.

## Scope
1. `kanbanana` CLI command boots local server and opens browser.
2. Board columns: backlog, to-do, in-progress, ready-for-review, done.
3. Task CRUD and drag/drop transitions.
4. ACP integration path for running one task with one provider.
5. Basic in-progress activity stream on card detail.
6. Local persistence for tasks and board state.

## Out of Scope
1. Worktree mode.
2. Rich diff review.
3. Commit and PR actions.
4. Keyboard-first shortcuts.

## Test Gate
1. Launch `kanbanana`.
2. Create task in backlog and move to to-do.
3. Move task to in-progress and confirm ACP run starts.
4. Observe streamed status and completion transition to ready-for-review.
5. Restart app and verify state persists.

## Exit Criteria
1. A new user can run one end-to-end ACP task from Kanban UI.
2. State survives restart without manual recovery.

