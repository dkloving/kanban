# Phase 08 Plan: Decompose Workflow

## Goal
Turn large tasks into executable subtasks with suggested dependency structure.

## Scope
1. Decompose action on task detail.
2. Headless structured-output run for subtask and dependency generation.
3. Review-and-approve step before creating subtasks.
4. Fan-out creation flow into board columns.

## Out of Scope
1. Full autonomous planning beyond one decomposition request.
2. Multi-agent race experiments.

## Test Gate
1. Run decompose on a large parent task.
2. Review generated JSON output in approval UI.
3. Accept output and create child tasks plus links.
4. Verify children can execute through existing dependency engine.

## Exit Criteria
1. Decomposition output is actionable and understandable.
2. Users can approve or reject before board mutation.

