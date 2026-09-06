const colors = {
  primary: '#53b0eb',
  // Darkened from #0678be: as link and active-state text it has to clear 4.5:1
  // against base-200 (#f4f7fa), not just against white.
  primaryFocus: '#036397',
  secondary: '#41b883',
  secondaryFocus: '#3b8070',
  accent: '#37cdbe',
  accentFocus: '#2aa79b',
}

// Shared prose rules. Colours reference the daisyUI CSS variables so the same
// config serves both themes.
const prose = (theme) => ({
  css: {
    maxWidth: 'none',
    color: 'hsl(var(--bc) / 0.85)',
    // The docs link to Drupal.org issues and GitLab merge requests as bare
    // URLs, and an unbroken 600px link cannot be wrapped by normal word
    // breaking - it pushed the whole page sideways on a phone. Measured on
    // /guide/multilingual at 375px: the document scrolled to 702px, moving
    // the header and sidebar with it. Only the long token breaks; ordinary
    // prose still wraps between words.
    overflowWrap: 'break-word',
    'a, code': { overflowWrap: 'anywhere' },
    // Every colour below resolves from the theme. Anything left to the
    // typography plugin's defaults (bold text, table headers, list markers,
    // captions) renders near-black and disappears in dark mode.
    a: {
      color: 'hsl(var(--pf))',
      textDecoration: 'none',
      fontWeight: '500',
      borderBottom: '1px solid hsl(var(--b3))',
      '&:hover': { borderBottomColor: 'hsl(var(--pf))' },
    },
    'h1, h2, h3, h4': { color: 'hsl(var(--bc))', scrollMarginTop: '10.5rem' },
    'h2 > a, h3 > a': { borderBottom: 'none', fontWeight: 'inherit' },
    strong: { color: 'hsl(var(--bc))', fontWeight: '600' },
    'a strong, blockquote strong, thead th strong': { color: 'inherit' },
    'ul > li::marker, ol > li::marker': { color: 'hsl(var(--bc) / 0.6)' },
    'th, dt': { color: 'hsl(var(--bc))' },
    'figcaption, .lead': { color: 'hsl(var(--bc) / 0.7)' },
    kbd: { color: 'hsl(var(--bc))' },
    'a code': { color: 'hsl(var(--pf))' },
    code: {
      color: 'hsl(var(--pf))',
      backgroundColor: 'hsl(var(--b2))',
      padding: '0.15em 0.4em',
      borderRadius: '0.3rem',
      fontWeight: '500',
    },
    'code::before': { content: 'none' },
    'code::after': { content: 'none' },
    // pre: surface, Prism palette and copy button live in assets/css/code.css.
    'pre code': { backgroundColor: 'transparent', color: 'inherit', padding: 0 },
    blockquote: {
      borderLeftColor: colors.secondary,
      backgroundColor: 'hsl(var(--b2))',
      padding: '0.75rem 1.25rem',
      borderRadius: '0 0.5rem 0.5rem 0',
      fontStyle: 'normal',
      color: 'hsl(var(--bc) / 0.75)',
    },
    'blockquote p:first-of-type::before': { content: 'none' },
    'blockquote p:last-of-type::after': { content: 'none' },
    // table: header, row rules, scroll region and stacking live in assets/css/app.css.
    img: { borderRadius: theme('borderRadius.lg') },
    // Badges: linked images render as an inline row, not stacked blocks.
    'a > img': { display: 'inline-block', marginTop: '0', marginBottom: '0', borderRadius: '0' },
    hr: { borderColor: 'hsl(var(--b3))' },
  },
})

module.exports = {
  mode: 'jit',

  // @nuxtjs/color-mode drives the theme; Tailwind's own dark variant is left
  // on 'media' for the few places a utility is easier than a daisyUI token.
  darkMode: 'media',

  purge: [
    './components/**/*.{js,jsx,ts,tsx,vue}',
    './layouts/**/*.{js,jsx,ts,tsx,vue}',
    './pages/**/*.{js,jsx,ts,tsx,vue}',
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      maxWidth: {
        content: '46rem',
      },
      typography: (theme) => ({ DEFAULT: prose(theme) }),
    },
  },

  variants: { extend: {} },

  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui'),
  ],

  daisyui: {
    // Theme names match the values @nuxtjs/color-mode writes to data-theme.
    themes: [
      {
        light: {
          // White stays the text colour on brand fills - the conventional
          // look, and the brand hues below are untouched. The contrast
          // problem is solved in assets/css/app.css by filling the two
          // filled buttons with the darker in-family shade (primary-focus /
          // secondary-focus) rather than the pale tint, which no text colour
          // can sit on legibly.
          'primary': colors.primary,
          'primary-focus': colors.primaryFocus,
          'primary-content': '#ffffff',

          'secondary': colors.secondary,
          'secondary-focus': colors.secondaryFocus,
          'secondary-content': '#ffffff',

          'accent': colors.accent,
          'accent-focus': colors.accentFocus,
          'accent-content': '#ffffff',

          'neutral': '#3d4451',
          'neutral-focus': '#2a2e37',
          'neutral-content': '#ffffff',

          'base-100': '#ffffff',
          'base-200': '#f4f7fa',
          'base-300': '#dbe3ec',
          'base-content': '#1f2937',

          'info': '#2094f3',
          'success': '#009485',
          'warning': '#ff9900',
          'error': '#ff5724',
        },
      },
      {
        dark: {
          'primary': colors.primary,
          'primary-focus': '#7cc5f1',
          'primary-content': '#08121b',

          'secondary': colors.secondary,
          'secondary-focus': '#68cb9f',
          'secondary-content': '#08121b',

          'accent': colors.accent,
          'accent-focus': '#5ddbcf',
          'accent-content': '#08121b',

          'neutral': '#1c2530',
          'neutral-focus': '#131b23',
          'neutral-content': '#e5ecf1',

          'base-100': '#0f1720',
          'base-200': '#16202b',
          'base-300': '#243040',
          'base-content': '#e5ecf1',

          'info': '#53b0eb',
          'success': '#2aa79b',
          'warning': '#ffb547',
          'error': '#ff7a56',
        },
      },
    ],
  },
}
