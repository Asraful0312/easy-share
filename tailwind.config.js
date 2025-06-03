/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#E0F2FE", // Light blue for backgrounds or highlights
          DEFAULT: "#0EA5E9", // Sky blue - main primary color
          hover: "#0284C7", // Darker sky blue for hover states
          dark: "#0369A1",  // Even darker blue for text or borders
        },
        secondary: {
          light: "#F3F4F6", // Light gray
          DEFAULT: "#6B7280", // Medium gray
          dark: "#374151",   // Dark gray
        },
        // You can add more specific colors like success, error, warning
        success: {
          light: "#D1FAE5",
          DEFAULT: "#10B981",
          dark: "#059669",
        },
        error: {
          light: "#FEE2E2",
          DEFAULT: "#EF4444",
          dark: "#DC2626",
        },
      },
      spacing: {
        section: "4rem", // Or your preferred spacing
      },
      borderRadius: {
        container: "0.75rem", // Or your preferred border radius
      },
      boxShadow: {
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      }
    },
  },
  plugins: [],
};
