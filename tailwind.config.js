/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        // Tonos 600-950 = color de marca OSCURECIDO, como en la escala de Tailwind.
        // Antes eran el mismo color con transparencia, que sobre blanco queda MÁS
        // CLARO y no llegaba al contraste mínimo 4.5:1 (WCAG AA). Los calcula
        // BrandingService (core/branding/contraste.ts) según los colores elegidos en
        // Branding; el color-mix es el respaldo mientras no corre (SSR).
        // `ink` = el color para usarlo como TEXTO; `on-<color>` = texto encima del color.

        primary: {
          DEFAULT: "var(--primary-color)",
          50: 'rgba(var(--primary-color-rgb), 0.05)',
          100: 'rgba(var(--primary-color-rgb), 0.1)',
          200: 'rgba(var(--primary-color-rgb), 0.2)',
          300: 'rgba(var(--primary-color-rgb), 0.3)',
          400: 'rgba(var(--primary-color-rgb), 0.4)',
          500: 'var(--primary-color)',
          ink: 'var(--primary-ink-color, var(--primary-color))', 
          600: 'var(--primary-600, color-mix(in srgb, var(--primary-color) 70%, black))',
          700: 'var(--primary-700, color-mix(in srgb, var(--primary-color) 58%, black))',
          800: 'var(--primary-800, color-mix(in srgb, var(--primary-color) 48%, black))',
          900: 'var(--primary-900, color-mix(in srgb, var(--primary-color) 38%, black))',
          950: 'var(--primary-950, color-mix(in srgb, var(--primary-color) 28%, black))',
        },

        secondary: {
          DEFAULT: "var(--secondary-color)",
          50: 'rgba(var(--secondary-color-rgb), 0.05)',
          100: 'rgba(var(--secondary-color-rgb), 0.1)',
          200: 'rgba(var(--secondary-color-rgb), 0.2)',
          300: 'rgba(var(--secondary-color-rgb), 0.3)',
          400: 'rgba(var(--secondary-color-rgb), 0.4)',
          500: 'var(--secondary-color)',
          ink: 'var(--secondary-ink-color, var(--secondary-color))',
          600: 'var(--secondary-600, color-mix(in srgb, var(--secondary-color) 70%, black))',
          700: 'var(--secondary-700, color-mix(in srgb, var(--secondary-color) 58%, black))',
          800: 'var(--secondary-800, color-mix(in srgb, var(--secondary-color) 48%, black))',
          900: 'var(--secondary-900, color-mix(in srgb, var(--secondary-color) 38%, black))',
          950: 'var(--secondary-950, color-mix(in srgb, var(--secondary-color) 28%, black))',
        },

        success: {
          DEFAULT: "var(--success-color)",
          50: 'rgba(var(--success-color-rgb), 0.05)',
          100: 'rgba(var(--success-color-rgb), 0.1)',
          500: 'var(--success-color)',
          600: 'var(--success-600, color-mix(in srgb, var(--success-color) 70%, black))',
          700: 'var(--success-700, color-mix(in srgb, var(--success-color) 58%, black))',
        },

        warning: {
          DEFAULT: "var(--warning-color)",
          50: 'rgba(var(--warning-color-rgb), 0.05)',
          500: 'var(--warning-color)',
          600: 'var(--warning-600, color-mix(in srgb, var(--warning-color) 70%, black))',
          700: 'var(--warning-700, color-mix(in srgb, var(--warning-color) 58%, black))',
        },

        danger: {
          DEFAULT: "var(--danger-color)",
          50: 'rgba(var(--danger-color-rgb), 0.05)',
          500: 'var(--danger-color)',
          600: 'var(--danger-600, color-mix(in srgb, var(--danger-color) 70%, black))',
          700: 'var(--danger-700, color-mix(in srgb, var(--danger-color) 58%, black))',
        },

        info: {
          DEFAULT: "var(--info-color)",
          50: 'rgba(var(--info-color-rgb), 0.05)',
          500: 'var(--info-color)',
          600: 'var(--info-600, color-mix(in srgb, var(--info-color) 70%, black))',
          700: 'var(--info-700, color-mix(in srgb, var(--info-color) 58%, black))',
        },

        surface: {
          DEFAULT: "var(--surface-color)",
          50: 'rgba(var(--surface-color-rgb), 0.05)',
          100: 'rgba(var(--surface-color-rgb), 0.1)',
          200: 'rgba(var(--surface-color-rgb), 0.2)',
        },

        'on-primary': 'var(--on-primary-color, #ffffff)',
        'on-secondary': 'var(--on-secondary-color, #ffffff)',
        'on-success': 'var(--on-success-color, #ffffff)',
        'on-warning': 'var(--on-warning-color, #ffffff)',
        'on-danger': 'var(--on-danger-color, #ffffff)',
        'on-info': 'var(--on-info-color, #ffffff)',

        content: {
          DEFAULT: "var(--text-color)",
          muted: 'rgba(var(--text-color-rgb), 0.72)',
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