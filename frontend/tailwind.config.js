/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        umbrella: {
          bg: '#FFFFFF',
          'bg-alt': '#F7F5F2',
          dark: '#1C1C1C',
          text: '#1C1C1C',
          'text-secondary': '#6B6B6B',
          'text-light': '#9A9A9A',
          accent: '#2D6A4F',
          'accent-light': '#D8F3DC',
          warm: '#B08D57',
          'warm-light': '#E8DCC8',
          border: '#E5E2DD',
        },
      },
    },
  },
  plugins: [],
};
