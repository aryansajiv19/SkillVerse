import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Figtree", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Figtree", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        nebula: {
          start: "hsl(var(--nebula-start))",
          mid: "hsl(var(--nebula-mid))",
          end: "hsl(var(--nebula-end))",
        },
        glow: {
          completed: "hsl(var(--glow-completed))",
          unlocked: "hsl(var(--glow-unlocked))",
          locked: "hsl(var(--glow-locked))",
        },
      },
      backgroundImage: {
        "nebula-gradient": "linear-gradient(to bottom, hsl(var(--nebula-start)), hsl(var(--nebula-mid)), hsl(var(--nebula-end)))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        // Lines of a just-formed constellation: dark, then a bright flare that settles to gold.
        "constellation-form": {
          "0%": { strokeOpacity: "0", strokeWidth: "2.2" },
          "35%": { strokeOpacity: "1", strokeWidth: "4" },
          "100%": { strokeOpacity: "0.9", strokeWidth: "2.2" },
        },
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "constellation-form": "constellation-form 1.6s cubic-bezier(0.23, 1, 0.32, 1) 0.25s both",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
