/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FDFBF7',
          100: '#FAF6F0',
          200: '#F4EFE6',
          300: '#E9DFD1',
          400: '#D8C7B5',
          500: '#A98D71',
          600: '#8B5A2B',
          700: '#6F441E',
          800: '#4D2F15',
          900: '#121212',
          wine: '#581825',
          'wine-dark': '#3B0D17',
          'wine-light': '#7E2537',
          gold: '#C5A880',
          beige: '#F4EFE6',
          dark: '#141414'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 10px 30px -5px rgba(20, 20, 20, 0.07)',
        'elevated': '0 20px 40px -10px rgba(20, 20, 20, 0.12)',
      }
    },
  },
  plugins: [],
}
