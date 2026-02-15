# Phase 10 Plan: Shared Project Config and Shortcuts

## Goal
Support team-shared project behavior through repo-level `.kanbanana` configuration.

## Scope
1. Repo-level config file under `.kanbanana/`.
2. Script shortcut buttons with icon, label, and command.
3. Run/test/custom command examples.
4. Optional command output preview panel.
5. Import and apply config on project open.

## Out of Scope
1. Complex secret management for shared commands.
2. Global usage analytics.

## Test Gate
1. Configure two shortcut buttons in `.kanbanana` config.
2. Run commands from UI and view output preview.
3. Clone repo on second machine/user and verify same shortcut setup appears.

## Exit Criteria
1. Project-level shortcuts are portable and reliable.
2. Team members share the same automation surface by default.

