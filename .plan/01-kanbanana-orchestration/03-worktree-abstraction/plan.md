# Phase 03 Plan: Worktree Abstraction

## Goal
Add safe parallel execution with per-task worktree isolation and explicit cleanup controls.

## Scope
1. Task execution mode selector: local or worktree.
2. Create worktree from selected base ref using detached HEAD.
3. Optional symlink strategy for selected ignored heavy paths.
4. Worktree inventory panel with task association.
5. Cleanup path tied to explicit move-to-done.

## Out of Scope
1. Advanced dependency orchestration.
2. Decomposition generation.
3. Keyboard and palette acceleration.

## Test Gate
1. Start two tasks in separate worktrees and run in parallel.
2. Verify local-mode task still works.
3. Move task to done and confirm controlled cleanup of linked worktree.

## Exit Criteria
1. Parallel task runs no longer collide in filesystem state.
2. Cleanup is predictable and user-controlled.

