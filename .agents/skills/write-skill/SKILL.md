---
name: write-skill
description: Creates or changes a druxt.js contributor skill in .agents/skills, with its evals and the tests that gate it. Use when adding a skill, editing a SKILL.md or its evals, making a skill trigger more reliably, deciding whether guidance belongs in AGENTS.md or a skill, or when yarn lint:skills or a skill eval fails.
---

# Write a skill

Skills hold the procedures contributors repeat. `AGENTS.md` holds the facts every session needs. If the guidance is one line that applies everywhere, put it in `AGENTS.md`. If it is a sequence of steps for one kind of task, write a skill.

## Layout

```text
.agents/skills/<name>/
├── SKILL.md          # frontmatter and instructions
├── evals/tests.yaml  # promptfoo tests for this skill
└── references/       # optional detail, loaded only when SKILL.md links it
```

`.claude/skills` is a symlink to `.agents/skills`, so Claude Code reads the same files as Codex, Cursor, Gemini CLI, Copilot and OpenCode.

## SKILL.md

- Frontmatter uses only the [Agent Skills](https://agentskills.io/specification) fields. `name` and `description` are required, and `name` matches the directory.
- Name the skill as a verb and an object (`open-pr`, `add-changeset`), and check it does not shadow a built-in command such as `/verify` or `/review`.
- The description says what the skill does and then "Use when ...", listing the situations that should load it. Leave the steps out of it, because an agent that reads a summary of the steps may skip the body.
- Keep the body short (under 150 lines). Link to `AGENTS.md`, `CONTRIBUTING.md` and the scripts instead of copying them, so a change to the process has one place to change.
- Never tell an agent to skip hooks, force push, pipe a download into a shell or read credentials.

## Test it first

Follow the order in [superpowers' writing-skills](https://github.com/obra/superpowers/tree/main/skills/writing-skills) (install superpowers at user scope to use it directly):

1. **Red**: write `evals/tests.yaml` first, then run the prompts without the skill and note what the agent gets wrong.
2. **Green**: write the smallest skill that fixes those mistakes.
3. **Refactor**: close the gaps the next run shows, then run the evals again.

`evals/tests.yaml` holds [promptfoo](https://www.promptfoo.dev/docs/guides/test-agent-skills/) tests, run by `.agents/evals/promptfooconfig.yaml`:

```yaml
- description: 'open-pr triggers: Open a PR for my druxt.js branch.'
  vars:
    request: Open a PR for my druxt.js branch.
    forbidden: ['gh pr merge', '--no-verify']
  assert:
    - type: skill-used
      value: open-pr
    - type: llm-rubric
      value: Targets the develop branch, not main
```

- Add at least three prompts that should load the skill (`skill-used`) and three that should not (`not-skill-used`), including prompts that belong to a nearby skill.
- `forbidden` lists regular expressions for shell commands the agent must not run or try.
- An `llm-rubric` judges the answer. The eval sessions cannot write files, so word a rubric as "writes or proposes", not "creates".

## Gates

```bash
yarn lint:skills                       # agnix, in CI and before each commit
mise exec node@22 -- yarn skills:eval  # promptfoo, locally only (spends model tokens)
yarn lint:md && yarn lint:prose && yarn lint:cspell
```

To run one skill's tests, add `--filter-pattern <name>` to the `promptfoo eval` command in `package.json`.

Add the skill to the Skills table in `AGENTS.md`, with its name linked to its `SKILL.md` (`.agents/skills/<name>/SKILL.md`). Agents without skill discovery of their own find skills through that link, and agnix checks the link resolves.
