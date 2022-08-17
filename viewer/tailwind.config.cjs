/* eslint-disable */
const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    './src/**/*.vue'
  ],
  theme: {
    screens: false,
    spacing: {
      '0': '0',
      'px': '1px',
      '0.5': '2px',
      '1': '3px',
      '1.5': '5px',
      '2': '6px',
      '2.5': '8px',
      '3': '9px',
      '3.5': '11px',
      '4': '12px',
      '5': '15px',
      '6': '18px',
      '7': '21px',
      '8': '24px',
      '9': '27px',
      '10': '30px',
      '12': '36px',
      '14': '42px',
      '16': '48px',
      '20': '60px',
      '24': '72px',
      '32': '96px',
      '48': '144px',
      '60': '180px',
      '64': '192px',
      '72': '216px',
    },
    fontSize: {
      xs: ['12px', { lineHeight: '1' }],
      sm: ['13px', { lineHeight: '1.25' }],
      base: ['14px', { lineHeight: '1.5' }],
      lg: ['16px', { lineHeight: '1.75' }],
      xl: ['18px', { lineHeight: '1.75' }]
    },
    extend: {
      colors: {
        gray: colors.slate,
        blue: colors.sky,
        green: colors.teal
      }
    }
  }
}
