/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        nav: '#111329',
        'nav-hover': '#262944',
        'nav-active': '#B8AEFF',
        acc: '#675CE7',
        ok: '#158A78',
        warn: '#C98235',
        danger: '#D65467',
        qbg: '#F5F5FA',
        card: '#FFFFFF',
        border: '#E5E5F0',
        ink: '#1B1C32',
        muted: '#777991',
        light: '#F0EFFF',
        hdr: '#17182E',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', '"DM Sans"', 'sans-serif'],
      },
      fontSize: {
        13: '13px',
      },
      boxShadow: {
        subtle: '0 2px 10px rgba(30, 29, 66, 0.04)',
        card: '0 14px 34px rgba(39, 35, 91, 0.10)',
        popover: '0 18px 48px rgba(17, 19, 41, 0.2)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        slideUp: { '0%': { opacity: 0, transform: 'translateY(6px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        fadeIn: 'fadeIn .18s ease-out',
        slideUp: 'slideUp .18s ease-out',
      },
    },
  },
  plugins: [],
};
