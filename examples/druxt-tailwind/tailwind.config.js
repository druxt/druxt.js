module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,vue}',
  ],
  theme: {
    extend: {
      colors: {
        // A single accent color (the Umami brand red) used sparingly against
        // an otherwise monochrome (gray-scale) palette - the utility-first
        // counterpart to druxt-daisyui's warmer, component-driven theme.
        accent: {
          DEFAULT: '#da3c13',
          dark: '#b3300f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
