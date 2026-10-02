---
name: write-skill
description: Creates or changes a druxt.js contributor skill in .agents/skills, with its evals and the tests that gate it. Use when adding a skill, editing an existing SKILL.md, deciding whether guidance belongs in AGENTS.md or a skill, or when a skill check fails.
---

# Write a skill

Skills hold the procedures contributors repeat. `AGENTS.md` holds the facts every session needs. If the guidance is one line that applies everywhere, put it in `AGENTS.md`. If it is a sequence of steps for one kind of task, write a skill.

## Layout

```text
.agents/skills/<name>/
├── SKILL.md            # frontmatter and instructions
├── evals/evals.json    # behaviour cases
├── evals/triggers.json # prompts that should and should not load the skill
└── references/         # optional detail, loaded only when SKILL.md links it
```

`.claude/skills` is a symlink to `.agents/skills`, so Claude Code reads the same files as Codex, Cursor, Gemini CLI, Copilot and OpenCode.

## SKILL.md

- Frontmatter uses only the [Agent Skills](https://agentskills.io/specification) fields. `name` and `description` are required, and `name` matches the directory.
- Name the skill as a verb and an object (`open-pr`, `add-changeset`), and check it does not shadow a built-in command such as `/verify` or `/review`.
- The description says what the skill does and then "Use when ...", listing the situations that should load it. Leave the steps out of it, because an agent that reads a summary of the steps may skip the body.
- Keep the body short (under 150 lines). Link to `AGENTS.md`, `CONTRIBUTING.md` and the scripts instead of copying them, so a change to the process has one place to change.
- Every `yarn` script, `make` target, path and skill you name must exist. `yarn lint:skills` checks this.
- Never tell an agent to skip hooks, force push, pipe a download into a shell or read credentials.

## Test it first

Follow the order in [superpowers' writing-skills](https://github.com/obra/superpowers/tree/main/skills/writing-skills) (install superpowers at user scope to use it directly):

1. **Red**: write `evals/evals.json` and `evals/triggers.json` first, then run the prompts without the skill and note what the agent gets wrong.
2. **Green**: write the smallest skill that fixes those mistakes.
3. **Refactor**: close the gaps the next run shows, then run the evals again.

Each case in `evals/evals.json` has a `prompt`, the `expectations` a reviewer checks, and `checks` the runner grades from the transcript: `tools_forbidden_before_skill`, `commands_forbidden` and `commands_required` (regular expressions). `evals/triggers.json` needs at least three prompts that should load the skill and three that should not.

## Gates

```bash
yarn lint:skills        # static checks, run in CI on every pull request
yarn lint:skills:test   # unit tests for the checker and the eval grader
yarn skills:eval <name> # live evals through the claude CLI, run by hand
yarn lint:md && yarn lint:prose && yarn lint:cspell
```

Add the skill to the table in the Skills section of `AGENTS.md`. `yarn lint:skills` fails until it is listed. `scripts/skills/README.md` documents the checks and the eval format.
