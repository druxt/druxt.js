// Fails when a skill's description doesn't say when to load it.
//
// Agents choose a skill from its description alone, so write-skill asks
// for "what it does" followed by "Use when ...". agnix checks the frontmatter
// fields but not this, so `yarn lint:skills` runs it after agnix.
import { readdirSync, readFileSync } from 'node:fs';

const root = '.agents/skills';
const missing = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `${root}/${entry.name}/SKILL.md`)
  .filter((file) => {
    const frontmatter = readFileSync(file, 'utf8').split(/^---$/m)[1] || '';
    // The description runs from its key to the next top-level key.
    const description =
      (frontmatter.match(/^description:([\s\S]*?)(?=^\S|$(?![\s\S]))/m) ||
        [])[1] || '';
    return !/\bUse when\b/.test(description);
  });

if (missing.length) {
  console.error(
    'These skill descriptions need a "Use when ..." sentence (see the write-skill skill):',
  );
  missing.forEach((file) => console.error(`  ${file}`));
  process.exit(1);
}
