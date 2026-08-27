/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        upam: {
          primary: '#1B4F72',
          secondary: '#2E86C1',
          accent: '#F39C12',
          dark: '#1a202c',
          light: '#EBF5FB',
        },
      },
    },
  },
  plugins: [],
};
