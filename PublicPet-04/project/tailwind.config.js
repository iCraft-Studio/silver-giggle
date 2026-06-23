/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', 
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          // The deep navy from your logo
          DEFAULT: '#011434', 
          50: '#f0f2f5',
          100: '#e1e5eb',
          200: '#c2cbd7',
          300: '#93a1b8',
          400: '#607294',
          500: '#011434', // Your Logo Color
          600: '#01102a',
          700: '#010d22',
          800: '#010a1a',
          900: '#010814',
          950: '#00040a',
        },
        // Adding a secondary accent that pops in dark mode
        accent: {
          DEFAULT: '#3b82f6', // A bright blue to complement the dark navy
          dark: '#2563eb',
        }
      },
      // Optional: Add custom dark-specific shadows
      boxShadow: {
        'glow': '0 0 15px -3px rgba(59, 130, 246, 0.5)',
      }
    },
  },
  plugins: [],
};