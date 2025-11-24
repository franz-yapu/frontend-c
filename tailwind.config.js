/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#95c11f", // Verde principal
          50: "#f7fce9",
          100: "#eef9d3",
          200: "#dcf3a8",
          300: "#caed7d",
          400: "#b7e752",
          500: "#95C11F",   // color solicitado
          600: "#7da41a",
          700: "#648516",
          800: "#4b6611",
          900: "#32470c",
          950: "#1f2b07",
        },
        secondary: {
          DEFAULT: "#000000",
          50: "#FFF3E5",
          100: "#FFE5C7",
          200: "#FFD29E",
          300: "#FFBF75",
          400: "#FFAD4D",
          500: "#FF9A24",
          600: "#FA8600",
          700: "#D17100",
          800: "#A85B00",
          900: "#804500",
          950: "#472700",
        },
        light: "#ffffff",

        gray: { /* ... tus grises ... */ },
        green: { /* ... tus verdes ... */ },
        sky: { /* ... */ },
        yellow: { /* ... */ },
        red: { /* ... */ },
        indigo: { /* ... */ },

        bgligth: "#F3EDE5",
        bgdark: "#2A2826",
        bgbluegray: "#E2E8F0",
        bgZinc: "#34C0C8",
        bgDarkZinc: "#1a848a",
      },

      keyframes: {
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        flip: {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(360deg)" },
        },
        "flip-back": {
          "0%": { transform: "rotateY(180deg)" },
          "100%": { transform: "rotateY(0deg)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: 0 },
          "100%": { transform: "translateX(0)", opacity: 1 },
        },
        "slide-out-left": {
          "0%": { transform: "translateX(0)", opacity: 1 },
          "100%": { transform: "translateX(-100%)", opacity: 0 },
        },
      },

      animation: {
        "fade-in": "fade-in 0.5s ease-in-out",
        flip: "flip 0.6s ease-in-out forwards",
        "flip-back": "flip-back 0.6s ease-in-out forwards",
        "slide-in-right": "slide-in-right 0.6s ease-in-out forwards",
        "slide-out-left": "slide-out-left 0.6s ease-in-out forwards",
      }
    },
  },
  plugins: [],
};
