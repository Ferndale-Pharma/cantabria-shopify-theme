const plugin = require('tailwindcss/plugin');
module.exports = {
  prefix: 'twcss-',
  content: [
    './layout/*.liquid',
    './templates/*.liquid',
    './templates/customers/*.liquid',
    './sections/*.liquid',
    './snippets/*.liquid',
  ],
  theme: {
    screens: {
      sm: '320px',
      md: '750px',
      lg: '990px',
      xlg: '1440px',
      x2lg: '1920px',
      pageMaxWidth: '1440px',
    },
    extend: {
      fontFamily: {
        heading: 'var(--font-heading-family)',
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      const containerBreak = {
        '.container-break': {
          left: '50%',
          'margin-left': '-50vw',
          'margin-right': '-50vw',
          'max-width': '100vw',
          position: 'relative',
          right: '50%',
          width: '100vw',
        },
        '.container-break-reset': {
          'margin-left': '0',
          'margin-right': '0',
          transform: 'none',
          width: 'auto',
        },
      };
      addUtilities(containerBreak);
    }),
  ],
};
