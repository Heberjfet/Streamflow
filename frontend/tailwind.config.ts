import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#050505',
        primary: '#A855F7',
        secondary: '#D946EF',
        surface: '#121212',
        border: '#262626',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A1A1AA',
      },
    },
  },
  plugins: [],
};

export default config;
