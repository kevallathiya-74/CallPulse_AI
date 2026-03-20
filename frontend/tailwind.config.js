/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#030812',
        primary: '#00D4FF',
        secondary: '#7B2FFF',
        accent: '#FF6B35',
        success: '#00E676',
        warning: '#FFD600',
        error: '#FF3D57',
        'text-primary': '#E8F4FD',
        'text-muted': 'rgba(232,244,253,0.5)',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        card: '18px',
        button: '50px',
        icon: '14px',
      },
      backdropBlur: {
        glass: '14px',
      },

      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
};
