/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Vintage/faded color palette
        cream: "#F2F1E8",
        paper: "#E7E2D3",
        yellowedPaper: "#E5DFC5",
        newsprint: "#DADAD2",
        oldInk: "#2D2D2A",
        fadedBlack: "#333333",

        // Dispo camera inspired
        flash: "#FFF9E6",
        overexposed: "#FFFCF0",
        filmRed: "#D14836",
        filmBlue: "#436B94",
        filmGreen: "#2D5547",

        // Accent colors
        accent1: "#935E3B", // brown
        accent2: "#5E7489", // dusty blue
        accent3: "#9D8354", // gold
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
        mono: ["Courier New", "monospace"],
        headline: ["Georgia", "Cambria", "Times New Roman", "serif"],
        body: ["Courier New", "monospace"],
      },
      borderWidth: {
        3: "3px",
        5: "5px",
        6: "6px",
      },
      boxShadow: {
        polaroid:
          "0 1px 2px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 8px rgba(0, 0, 0, 0.05)",
        newspaper: "2px 2px 0 rgba(0, 0, 0, 0.1)",
      },
      spacing: {
        18: "4.5rem",
        68: "17rem",
        100: "25rem",
        128: "32rem",
      },
      backgroundImage: {
        "newsprint-texture": "url('/src/assets/textures/newsprint.png')",
        "paper-texture": "url('/src/assets/textures/paper.png')",
      },
    },
  },
  plugins: [
    function ({ addComponents, theme }) {
      addComponents({
        // Polaroid-style photo frame
        ".photo-frame": {
          backgroundColor: theme("colors.white"),
          padding: theme("spacing.3"),
          paddingBottom: theme("spacing.16"),
          boxShadow: theme("boxShadow.polaroid"),
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: theme("spacing.3"),
            left: "50%",
            transform: "translateX(-50%)",
            width: "80%",
            height: theme("spacing.10"),
            backgroundColor: theme("colors.white"),
          },
        },

        // Newspaper-style headline
        ".newspaper-headline": {
          fontFamily: theme("fontFamily.headline"),
          fontSize: theme("fontSize.3xl"),
          fontWeight: theme("fontWeight.bold"),
          textTransform: "uppercase",
          letterSpacing: theme("letterSpacing.wide"),
          lineHeight: 1.1,
          textAlign: "center",
          borderBottom: `3px solid ${theme("colors.oldInk")}`,
          marginBottom: theme("spacing.4"),
          paddingBottom: theme("spacing.2"),
        },

        // Magazine column
        ".magazine-column": {
          columnCount: 2,
          columnGap: theme("spacing.8"),
          columnRule: `1px solid ${theme("colors.gray.300")}`,
          fontSize: theme("fontSize.sm"),
          textAlign: "justify",
        },

        // Disposable camera viewfinder
        ".viewfinder": {
          position: "relative",
          border: `10px solid ${theme("colors.black")}`,
          borderRadius: theme("borderRadius.sm"),
          overflow: "hidden",
          "&::before": {
            content: '""',
            display: "block",
            paddingBottom: "75%", // 4:3 aspect ratio
          },
        },

        // Date stamp effect
        ".date-stamp": {
          fontFamily: theme("fontFamily.mono"),
          color: theme("colors.filmRed"),
          fontSize: theme("fontSize.xs"),
          padding: theme("spacing.1"),
          backgroundColor: "transparent",
          position: "absolute",
          bottom: theme("spacing.2"),
          right: theme("spacing.2"),
        },
      });
    },
  ],
};
