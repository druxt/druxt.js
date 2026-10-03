// Lines AI coding tools add to commit messages to credit themselves. Commits
// are made by the person contributing them, so these are refused.
const AI_ATTRIBUTION = [
  /^co-authored-by:.*\b(claude|anthropic|copilot|cursor ?agent|codex|openai|gemini|aider)\b.*$/im,
  /^claude-session:.*$/im,
  /^\S*https:\/\/claude\.ai\/code\/session_.*$/im,
  /^\W*generated (with|by) \[?(claude|anthropic|copilot|cursor|codex|openai|gemini|aider).*$/im,
];

const { default: isIgnored } = require('@commitlint/is-ignored');

const hasAttribution = (message) =>
  AI_ATTRIBUTION.some((pattern) => pattern.test(message || ''));

module.exports = {
  extends: ['@commitlint/config-conventional'],
  // commitlint skips merge-style messages ("Merge pull request …") before any
  // rule runs, so a subject like that would hide an attribution line. Skip
  // them only when they carry no attribution.
  defaultIgnores: false,
  ignores: [(message) => !hasAttribution(message) && isIgnored(message)],
  plugins: [
    {
      rules: {
        'no-ai-attribution': ({ raw }) => {
          const hit = AI_ATTRIBUTION.map((pattern) =>
            (raw || '').match(pattern),
          ).find(Boolean);
          return [
            !hit,
            hit && `remove the AI attribution line "${hit[0].trim()}"`,
          ];
        },
      },
    },
  ],
  rules: {
    'no-ai-attribution': [2, 'always'],
  },
};
