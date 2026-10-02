# Skill tests

The contributor skills in `.agents/skills/` are instructions in English, so an
agent may or may not follow them. These scripts test them in two layers: static
checks that run on every pull request, and live evals that run a real agent and
grade what it did.

| Command                     | What it does                                                 | Where it runs            |
| --------------------------- | ------------------------------------------------------------ | ------------------------ |
| `yarn lint:skills`          | Static checks over every skill                               | CI, every pull request   |
| `yarn lint:skills:test`     | `node:test` units for the checker and the eval grader        | CI, every pull request   |
| `yarn skills:eval [skill…]` | Live evals through the `claude` CLI, graded from transcripts | By hand, or the workflow |

## Static checks

`check.mjs` refuses a skill when any of these fail:

- **Structure**: `SKILL.md` exists, its frontmatter parses and uses only the
  [Agent Skills](https://agentskills.io/specification) fields, `name` matches
  the directory, the description is at most 1024 characters and says "Use
  when", and the file is at most 500 lines.
- **References**: every `yarn` script, root `make` target, repository path,
  relative link and other skill a skill names exists.
- **Guardrails**: no code block pipes a download into a shell, skips the git
  hooks or the permission checks, force pushes or reads credentials. No skill
  grants `Bash(*)` or uses Claude Code's `` !`command` `` injection.
- **Evals**: `evals/evals.json` has at least 2 cases, each with a prompt and
  expectations, and `evals/triggers.json` has at least 3 prompts each way.
- **Wiring**: `.claude/skills` is a symlink to `.agents/skills`, and the Skills
  table in `AGENTS.md` lists every skill and nothing else.

## Eval format

`evals/evals.json` follows the format of Anthropic's
[skill-creator](https://github.com/anthropics/skills/tree/main/skills/skill-creator),
with a `checks` object added for the deterministic grader:

```json
{
  "skill_name": "open-pr",
  "evals": [
    {
      "id": 1,
      "prompt": "The user message.",
      "expected_output": "What a good run does.",
      "expectations": ["A statement a reviewer can mark true or false."],
      "checks": {
        "tools_forbidden_before_skill": ["Write"],
        "commands_forbidden": ["git push", "gh pr merge"],
        "commands_required": ["yarn lint"]
      }
    }
  ]
}
```

`evals/triggers.json` is the skill-creator trigger set: a list of
`{ "query": "...", "should_trigger": true }` entries.

## Live evals

`eval.mjs` creates a throwaway git worktree of `HEAD`, copies the working
tree's skills into it, and runs each prompt through `claude -p` with
`--setting-sources project`, so the user's own skills and plugins stay out of
the result. The session runs in `dontAsk` permission mode with a read-only
allowlist (`Read`, `Grep`, `Glob`, `Skill` and read-only `git` commands).
Anything else the agent tries, such as `git push`, is refused, and is still
recorded in the transcript for the checks to catch.

Each transcript is graded on:

- whether the skill loaded, through the `Skill` tool or by reading its
  `SKILL.md`, and for trigger queries whether that matches `should_trigger`.
  A case that tests a rule `AGENTS.md` already carries sets
  `"skill_called": "optional"` and is graded on what the agent did
- whether a tool in `tools_forbidden_before_skill` ran before the skill loaded
- whether any shell command matched `commands_forbidden`, or none matched a
  `commands_required` pattern

```bash
yarn skills:eval                       # every skill, cases and triggers
yarn skills:eval open-pr --cases       # one skill, behaviour cases only
yarn skills:eval --triggers --model sonnet
yarn skills:eval --dry-run             # list the runs without starting any
```

Transcripts are saved under `.artifacts/skills-eval/` (git ignores it). The
`expectations` are for review by a person or an LLM judge, such as
skill-creator's grader. A judged result varies between runs, so the runner
leaves them ungraded and out of the pull request gate.

The "Skills eval" GitHub workflow runs the same command on demand. It needs an
`ANTHROPIC_API_KEY` repository secret and skips the run when there is none.
