/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        upam: {
          primary: 'rgb(var(--upam-primary) / <alpha-value>)',
          secondary: 'rgb(var(--upam-secondary) / <alpha-value>)',
          accent: 'rgb(var(--upam-accent) / <alpha-value>)',
          dark: '#1a202c',
          light: '#EBF5FB',
        },
      },
    },
  },
  plugins: [],
};
