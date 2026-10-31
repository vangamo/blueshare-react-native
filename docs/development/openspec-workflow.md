---
type: Guide
title: OpenSpec workflow
description: Features are planned as OpenSpec changes (proposal, specs, design, tasks) and implemented task by task. Specs are synced into openspec/specs and the change is archived.
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

## Current state

The change `basic-app-layout` (created 2026-10-31, branch `01-layout`) has all 51 of its tasks done. Its specs are synced into `openspec/specs/`. It is **not archived yet**: run `/opsx:archive` after review.
