module.exports = {
  content: [
    './components/**/*.{js,vue}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        umami: {
          'primary': '#e2572b',
          'primary-content': '#ffffff',

          'secondary': '#6b8f45',
          'secondary-content': '#ffffff',

          'accent': '#f2a93b',
          'accent-content': '#3a2e27',

          'neutral': '#3a2e27',
          'neutral-content': '#fff8f0',

          'base-100': '#fff8f0',
          'base-200': '#fbeee0',
          'base-300': '#f0dcc5',
          'base-content': '#3a2e27',

          '--rounded-box': '1rem',
          '--rounded-btn': '0.5rem',
        },
      },
      {
        'umami-dark': {
          'primary': '#f2764a',
          'primary-content': '#241b15',

          'secondary': '#8bb968',
          'secondary-content': '#241b15',

          'accent': '#f2a93b',
          'accent-content': '#241b15',

          'neutral': '#fbeee0',
          'neutral-content': '#241b15',

          'base-100': '#241b15',
          'base-200': '#2e241c',
          'base-300': '#3a2e27',
          'base-content': '#fbeee0',

          '--rounded-box': '1rem',
          '--rounded-btn': '0.5rem',
        },
      },
    ],
  },
}
