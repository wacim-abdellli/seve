# Agent Snapshot Rollback Design

## Context

The AI Agent currently stores inverse JSON Patch operations for every applied resume patch. That lets the UI offer a revert action, but it rejects some valid JSON Patch operations because the server must be able to invert them before applying the patch.

## Goal

Use persisted resume snapshots for agent rollback so valid JSON Patch operations can be applied without first generating inverse operations.

## Design

Agent patch actions store the original JSON Patch operations for audit/debugging and a `snapshotData` copy of the resume data from immediately before the patch was applied. The database column is `snapshot_data`.

When `apply_resume_patch` runs, the server reads the current working resume, stores `resume.data` as `snapshotData`, applies the model-generated JSON Patch through the existing resume patch validator, and records the resulting `appliedUpdatedAt`.

The existing action revert endpoint becomes snapshot rollback. Rolling back an action restores that action's `snapshotData`, which means the resume returns to the state before that patch. If the selected action is older than the latest applied action, every applied patch action at or after the selected action is marked `rolled_back` so the chat remains auditable and the UI can show which actions were undone.

Rollback keeps the version guard. The restore is allowed only when the current resume version still matches the latest applied patch action for that resume/thread. If the builder or another process changed the resume after the latest agent patch, rollback marks the selected action `conflicted` and does not replace the resume JSON.

Existing rows that only have `inverse_operations` are legacy non-revertible actions after the migration. The migration removes `inverse_operations` and adds nullable `snapshot_data`.

## UI

The latest applied patch can be undone with the existing action button. Older applied patches can also be restored, but the label should make the destructive effect clear: rolling back to an older action discards that action and later applied agent patches. Actions with status `rolled_back` display as rolled back and cannot be rolled back again.

## Testing

Service tests cover storing `snapshotData`, restoring a snapshot, marking later applied actions as `rolled_back`, conflict handling, and rejecting legacy actions without `snapshotData`. Schema tests cover the `snapshotData` column replacing `inverseOperations`.
