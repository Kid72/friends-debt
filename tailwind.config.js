/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Google Sans"', '"Google Sans Text"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        md: {
          primary: '#006A60',
          'on-primary': '#FFFFFF',
          'primary-container': '#70F7E5',
          'on-primary-container': '#00201C',
          secondary: '#4A635F',
          'on-secondary': '#FFFFFF',
          'secondary-container': '#CCE8E2',
          'on-secondary-container': '#05201C',
          tertiary: '#456179',
          'on-tertiary': '#FFFFFF',
          'tertiary-container': '#CCE5FF',
          'on-tertiary-container': '#001D31',
          error: '#BA1A1A',
          'on-error': '#FFFFFF',
          'error-container': '#FFDAD6',
          'on-error-container': '#410002',
          background: '#F4FAF8',
          'on-background': '#161D1C',
          surface: '#F4FAF8',
          'on-surface': '#161D1C',
          'surface-variant': '#DAE5E1',
          'on-surface-variant': '#3F4947',
          outline: '#6F7977',
          'surface-container-lowest': '#FFFFFF',
          'surface-container-low': '#EEF5F2',
          'surface-container': '#E8EFEC',
          'surface-container-high': '#E2EAE6',
          'surface-container-highest': '#DCE4E1',
        }
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
      }
    },
  },
  plugins: [],
};
