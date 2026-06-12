/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf3f3',
          100: '#fce4e4',
          200: '#facecf',
          300: '#f5abac',
          400: '#ed7a7c',
          500: '#e14d50',
          600: '#cd3033',
          700: '#ac2528',
          800: '#8f2224',
          900: '#772224',
          950: '#400d0e',
        },
        cream: '#fdf6f5',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};
