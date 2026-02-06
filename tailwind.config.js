/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        // Sobrescribir la paleta amber completa con tu color rojo
        amber: {
          50: 'rgb(255, 245, 245)',
          100: 'rgb(255, 230, 230)',
          200: 'rgb(255, 200, 200)',
          300: 'rgb(255, 170, 170)',
          400: 'rgb(255, 140, 140)',
          500: 'rgb(202, 54, 54)', // Tu color principal rojo
          600: 'rgb(180, 48, 48)',
          700: 'rgb(158, 42, 42)',
          800: 'rgb(136, 36, 36)',
          900: 'rgb(114, 30, 30)',
          950: 'rgb(92, 24, 24)',
        },

        primary: {
          DEFAULT: "rgb(158, 42, 42)",
           50: 'rgb(255, 245, 245)',
          100: 'rgb(255, 230, 230)',
          200: 'rgb(255, 200, 200)',
          300: 'rgb(255, 170, 170)',
          400: 'rgb(255, 140, 140)',
          500: 'rgb(202, 54, 54)', // Tu color principal rojo
          600: 'rgb(180, 48, 48)',
          700: 'rgb(158, 42, 42)',
          800: 'rgb(136, 36, 36)',
          900: 'rgb(114, 30, 30)',
          950: 'rgb(92, 24, 24)',
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
 azul: {
          50: 'rgb(237, 242, 247)',
          100: 'rgb(214, 224, 235)',
          200: 'rgb(171, 189, 211)',
          300: 'rgb(128, 154, 187)',
          400: 'rgb(85, 119, 163)',
          500: 'rgb(28, 62, 116)', // Tu color azul principal
          600: 'rgb(25, 56, 104)',
          700: 'rgb(22, 50, 92)',
          800: 'rgb(19, 44, 80)',
          900: 'rgb(16, 38, 68)',
          950: 'rgb(13, 32, 56)',
        },

       

        /* primary: {
          DEFAULT: "#95c11f",
          50: "#f7fce9",
          100: "#eef9d3",
          200: "#dcf3a8",
          300: "#caed7d",
          400: "#b7e752",
          500: "#95C11F",
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
 */
        light: "#ffffff",
        bgligth: "#F3EDE5",
        bgdark: "#2A2826",
        bgbluegray: "#E2E8F0",
        bgZinc: "#34C0C8",
        bgDarkZinc: "#1a848a",
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