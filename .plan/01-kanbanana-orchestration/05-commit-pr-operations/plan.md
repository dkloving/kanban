# Phase 05 Plan: Commit and PR Operations

## Goal
Enable shipping work from Kanbanana with detached HEAD aware commit and PR flows.

## Scope
1. Commit action from ready-for-review.
2. Detached HEAD commit path with cherry-pick to selected base branch.
3. PR creation action with preview and edit step.
4. Headless agent utility module for PR title/body generation.
5. PR detection and surfacing on card state.
6. Post-action state indicator that prompts user to move card to done.

## Out of Scope
1. Auto-transition from ready-for-review to done.
2. Dependency orchestration.

## Test Gate
1. Complete task in detached worktree.
2. Commit path successfully applies to target branch.
3. Create PR with generated draft text and user edits.
4. Verify card remains in ready-for-review until manual done move.

## Exit Criteria
1. User can commit and open PR without leaving Kanbanana.
2. No unwanted auto-cleanup behavior occurs.

