# Phase 07 Plan: Dependency Graph

## Goal
Allow tasks to depend on one another and automate unblocked execution.

## Scope
1. Dependency relation model between tasks.
2. UI to add, remove, and view dependency links.
3. Auto-start downstream tasks when prerequisites are complete.
4. Visual indicators of blocked versus unblocked state.

## Out of Scope
1. Automatic decomposition generation.
2. Multi-agent race support.

## Test Gate
1. Create chain A -> B -> C.
2. Complete A and verify B auto-start behavior from to-do.
3. Complete B and verify C auto-start behavior.
4. Validate blocked task cannot start early.

## Exit Criteria
1. Dependency execution order is deterministic and observable.
2. Users can trust automatic unblocking behavior.

