# Phase 02 Plan: Runtime Reliability

## Goal
Make task execution reliable under errors, interruptions, and long-running runs.

## Scope
1. Task lifecycle controls: start, stop, retry.
2. Explicit states: running, completed, failed, needs-attention.
3. Timeout and stuck-run detection baseline.
4. Browser notifications for needs-attention.
5. Session recovery for interrupted app process.

## Out of Scope
1. Worktree execution.
2. Diff view and git actions.
3. Task dependencies and decomposition.

## Test Gate
1. Trigger a failing run and verify failed state with retry path.
2. Trigger needs-attention state and verify notification behavior.
3. Stop and restart app mid-run and confirm recoverable state.

## Exit Criteria
1. Runtime failures do not corrupt board state.
2. User can reliably recover or retry interrupted work.

