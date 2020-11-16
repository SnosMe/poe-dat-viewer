module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    '@vue/standard',
    '@vue/typescript/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    '@typescript-eslint/no-non-null-assertion': ['off'],
    '@typescript-eslint/no-unused-vars': ['off'],
    '@typescript-eslint/member-delimiter-style': ['off'],
    '@typescript-eslint/no-use-before-define': ['off']
  },
  ignorePatterns: ['src/app/worker/app.js'],
}
