---
type: Guide
title: OpenSpec workflow
description: Features are planned as OpenSpec changes and implemented task by task. Specs are synced into openspec/specs, the change is archived, and then CLAUDE.md and docs/ are updated.
tags: [openspec, workflow, specs, process]
status: stable
generated:
  by: claude-code/claude-opus-5-5
  at: 2026-11-01T12:36:10Z
---

# OpenSpec workflow

BlueShare uses OpenSpec (CLI 1.16, schema `spec-driven`, local root `openspec/`) for every feature.

## Layout

- `openspec/specs/<capability>/spec.md`: the **current** specs. Today these are `app-shell`, `app-theming` and `app-platform`, see [Specs](../specs/index.md).
- `openspec/changes/<change>/`: an active change, with `proposal.md`, `design.md`, `specs/**` (delta specs), `tasks.md` and optional notes.
- `openspec/changes/archive/`: finished changes.

## Commands (Claude Code slash commands and skills)

| Command | Use |
| --- | --- |
| `/opsx:explore` | Think through an idea before committing to a change |
| `/opsx:propose <idea>` | Create a change with all its artifacts |
| `/opsx:update` | Revise a change's artifacts and keep them consistent (no code) |
| `/opsx:apply [change]` | Implement tasks one by one, ticking `- [x]` in `tasks.md` |
| `/opsx:sync` | Merge delta specs into `openspec/specs/` without archiving |
| `/opsx:archive` | Finish a change: sync the specs and move it to `archive/` |

Useful CLI calls: `openspec list --json`, `openspec status --change <name> --json`, `openspec instructions apply --change <name> --json`.

## Rules when applying

- Read the change's proposal, specs, design and tasks before coding.
- Mark a task done only when its specified behavior is fully implemented and the [definition of done](definition-of-done.md) holds.
- If work goes beyond the spec, or a requirement would have to be narrowed, stop and update the artifacts, or ask the user.

## After archiving: update the context

`openspec/config.yaml` sets `operations.archive.guidance`. OpenSpec passes it to `/opsx:archive` as `operationGuidance`, and `openspec instructions archive --change <name> --json` shows it. Once the change has been **moved into `archive/`** (never when the archive stopped), the agent brings the project context in line with what shipped:

1. **`docs/`:**
   - the `docs/specs/` page for each capability that was added, changed or removed
   - the architecture, design-system, component and development pages the change affects
   - a `docs/decisions/` page for each new decision in the change's `design.md`
   - the roadmap, the known limitations, and "Current state" below
2. **OKF conformance:** frontmatter with `type` and a refreshed `generated.at`, new files listed in their folder's `index.md`, and pages for removed things deleted.
3. **`CLAUDE.md`:** the "Current state" paragraph, "Key rules" only if a rule changed, and the "When to read what" rows. Also the nested `src/*/CLAUDE.md` files and the project skills, if their rules or steps changed.
4. A dated entry in `docs/log.md`, a check that all links resolve, and the list of updated files in the archive summary.

Limits:
- The guidance is **advisory**: the agent follows it when it fits the workflow.
- It only runs through `/opsx:archive`. The bare `openspec archive` CLI and `/opsx:sync` do not trigger it. After either of those, update the context by hand, following the same list.
- Edit the rule itself in `openspec/config.yaml`. An invalid field there is dropped with a warning instead of failing the command.

## Current state

The change `basic-app-layout` (created 2026-10-31, branch `01-layout`) has all 51 of its tasks done. Its specs are synced into `openspec/specs/`. It is **not archived yet**: run `/opsx:archive` after review.
