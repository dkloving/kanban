# Phase 06 Plan: Task Context System

## Goal
Improve task quality by attaching meaningful context sources.

## Scope
1. Context attachments:
   - GitHub issue URLs
   - GitHub PR URLs
   - Linear ticket links
   - file path references
2. Tasks-as-context attachment flow.
3. Context resolver pipeline and normalized payload sent to runtime.
4. Task detail UI for adding/removing context references.

## Out of Scope
1. Dependency-based auto-execution.
2. Decomposition generation.

## Test Gate
1. Run a task with at least two external context references.
2. Run a task that references a prior task as context.
3. Confirm resolved context appears in runtime input and improves execution fidelity.

## Exit Criteria
1. Context assembly is reliable and debuggable.
2. Users can reuse prior task knowledge without manual copy/paste.

