/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {

        primary: {
          DEFAULT: "var(--primary-color)",
          50: 'rgba(var(--primary-color-rgb), 0.05)',
          100: 'rgba(var(--primary-color-rgb), 0.1)',
          200: 'rgba(var(--primary-color-rgb), 0.2)',
          300: 'rgba(var(--primary-color-rgb), 0.3)',
          400: 'rgba(var(--primary-color-rgb), 0.4)',
          500: 'var(--primary-color)', 
          600: 'rgba(var(--primary-color-rgb), 0.8)',
          700: 'rgba(var(--primary-color-rgb), 0.9)',
          800: 'rgba(var(--primary-color-rgb), 0.95)',
          900: 'rgba(var(--primary-color-rgb), 1)',
          950: 'rgba(var(--primary-color-rgb), 1)',
        },

        secondary: {
          DEFAULT: "var(--secondary-color)",
          50: 'rgba(var(--secondary-color-rgb), 0.05)',
          100: 'rgba(var(--secondary-color-rgb), 0.1)',
          200: 'rgba(var(--secondary-color-rgb), 0.2)',
          300: 'rgba(var(--secondary-color-rgb), 0.3)',
          400: 'rgba(var(--secondary-color-rgb), 0.4)',
          500: 'var(--secondary-color)',
          600: 'rgba(var(--secondary-color-rgb), 0.8)',
          700: 'rgba(var(--secondary-color-rgb), 0.9)',
          800: 'rgba(var(--secondary-color-rgb), 0.95)',
          900: 'rgba(var(--secondary-color-rgb), 1)',
          950: 'rgba(var(--secondary-color-rgb), 1)',
        },

        success: {
          DEFAULT: "var(--success-color)",
          50: 'rgba(var(--success-color-rgb), 0.05)',
          100: 'rgba(var(--success-color-rgb), 0.1)',
          500: 'var(--success-color)',
          600: 'rgba(var(--success-color-rgb), 0.8)',
          700: 'rgba(var(--success-color-rgb), 0.9)',
        },

        warning: {
          DEFAULT: "var(--warning-color)",
          50: 'rgba(var(--warning-color-rgb), 0.05)',
          500: 'var(--warning-color)',
          600: 'rgba(var(--warning-color-rgb), 0.8)',
          700: 'rgba(var(--warning-color-rgb), 0.9)',
        },

        danger: {
          DEFAULT: "var(--danger-color)",
          50: 'rgba(var(--danger-color-rgb), 0.05)',
          500: 'var(--danger-color)',
          600: 'rgba(var(--danger-color-rgb), 0.8)',
          700: 'rgba(var(--danger-color-rgb), 0.9)',
        },

        info: {
          DEFAULT: "var(--info-color)",
          50: 'rgba(var(--info-color-rgb), 0.05)',
          500: 'var(--info-color)',
          600: 'rgba(var(--info-color-rgb), 0.8)',
          700: 'rgba(var(--info-color-rgb), 0.9)',
        },

        surface: {
          DEFAULT: "var(--surface-color)",
          50: 'rgba(var(--surface-color-rgb), 0.05)',
          100: 'rgba(var(--surface-color-rgb), 0.1)',
          200: 'rgba(var(--surface-color-rgb), 0.2)',
        },

        content: {
          DEFAULT: "var(--text-color)",
          muted: 'rgba(var(--text-color-rgb), 0.6)',
        },
      },
      
      

      borderRadius: {
        'brand': 'var(--border-radius)',
      },
      fontFamily: {
        'brand': ['var(--font-family)', 'sans-serif'],
      },
      keyframes: {
        fade: {
          "0%": { opacity: 0 },
          "10%": { opacity: 1 },
          "30%": { opacity: 1 },
          "40%": { opacity: 0 },
          "100%": { opacity: 0 },
        },

        scroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }
        }
      },

      animation: {
        fade: "fade 15s infinite ease-in-out",
        scroll: "scroll 30s linear infinite",
      }
    },
  },
  plugins: [],
};