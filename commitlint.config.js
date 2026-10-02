// Lines AI coding tools add to commit messages to credit themselves. Commits
// are made by the person contributing them, so these are refused.
const AI_ATTRIBUTION = [
  /^co-authored-by:.*\b(claude|anthropic|copilot|cursor ?agent|codex|openai|gemini|aider)\b.*$/im,
  /^claude-session:.*$/im,
  /^\S*https:\/\/claude\.ai\/code\/session_.*$/im,
  /^\W*generated (with|by) \[?(claude|copilot|cursor|codex|gemini|aider).*$/im,
];

module.exports = {
  extends: ['@commitlint/config-conventional'],
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
