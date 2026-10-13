/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#194777',
        'navy-hover': '#143A62',
        teal: '#19869B',
        mist: '#B2C8CA',
        sand: '#EABD82',
        coral: '#E96532',
        berry: '#A92343',
        ink: '#0E1B2A',
        muted: '#4A5B6B',
        bg: '#F6F9F9',
        surface: '#FFFFFF',
        'surface-subtle': '#EBF1F2',
      },
      borderRadius: {
        card: '12px',
        badge: '9999px',
        button: '10px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(14,27,42,.06), 0 4px 12px rgba(14,27,42,.06)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
