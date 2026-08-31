/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./content/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Sampled directly from the KAC logo — do not alter.
          navy: "#04509F", // primary — nav, headers, primary buttons
          navyDark: "#042345", // hover states, gradients, footer background
          teal: "#1E9EB8", // accent — links, highlights, dividers
          ice: "#C2F5FF", // pale section backgrounds (e.g. the homepage risk/trust section)
          offWhite: "#F7F9FC", // section backgrounds
          slate: "#2B2F36", // body text on white
          muted: "#6B7280", // captions, metadata
          success: "#1E8A5F", // confirmation states
          error: "#C0392B", // validation states
        },
      },
      fontFamily: {
        sans: [
          "var(--font-bricolage)",
          "system-ui",
          "ui-sans-serif",
          "sans-serif",
        ],
        display: [
          "var(--font-bricolage)",
          "system-ui",
          "ui-sans-serif",
          "sans-serif",
        ],
      },
      fontSize: {
        // Named type scale — prefer these over ad hoc text-4xl etc.
        hero: [
          "clamp(2.75rem, 5vw, 4rem)",
          { lineHeight: "1.05", letterSpacing: "-0.02em" },
        ],
        h1: [
          "clamp(2rem, 3.5vw, 2.75rem)",
          { lineHeight: "1.12", letterSpacing: "-0.015em" },
        ],
        h2: [
          "clamp(1.625rem, 2.5vw, 2rem)",
          { lineHeight: "1.18", letterSpacing: "-0.01em" },
        ],
        h3: ["1.375rem", { lineHeight: "1.3" }],
        h4: ["1.125rem", { lineHeight: "1.4" }],
        body: ["1rem", { lineHeight: "1.7" }],
        "body-lg": ["1.125rem", { lineHeight: "1.7" }],
        caption: ["0.8125rem", { lineHeight: "1.5", letterSpacing: "0.01em" }],
      },
      maxWidth: {
        container: "80rem", // matches max-w-7xl (1280px) — the site content width
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(11, 68, 130, 0.04), 0 4px 16px -4px rgba(11, 68, 130, 0.10)",
        "card-hover": "0 4px 24px -6px rgba(11, 68, 130, 0.18)",
      },
      keyframes: {
        // Continuous logo marquee. The track holds two identical copies of the
        // logo set, so translating -50% scrolls exactly one copy and loops
        // seamlessly.
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [],
};
