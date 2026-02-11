/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light theme colors
        background: 'var(--background)',
        'secondary-bg': 'var(--secondary-background)',
        card: 'var(--card)',
        border: 'var(--border)',
        divider: 'var(--divider)',
        foreground: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        accent: 'var(--accent)',
        error: 'var(--error)',
        success: 'var(--success)',
        // Genre colors
        'genre-drama': '#8B5CF6',
        'genre-thriller': '#EF4444',
        'genre-comedy': '#F59E0B',
        'genre-romance': '#EC4899',
        'genre-action': '#F97316',
        'genre-horror': '#DC2626',
        'genre-scifi': '#06B6D4',
        'genre-mystery': '#7C3AED',
        'genre-family': '#10B981',
        'genre-documentary': '#6B7280',
        'genre-other': '#9CA3AF',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
