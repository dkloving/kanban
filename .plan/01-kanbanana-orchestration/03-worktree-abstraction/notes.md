# Phase 03 Notes

## Decisions
1. Detached HEAD is default for worktree tasks to avoid branch pollution.
2. Done transition remains manual so cleanup is never surprising.

## Open Question
1. Which ignored paths are symlinked by default versus user opt-in.

## Risks
1. Symlink behavior and permissions vary across platforms.

