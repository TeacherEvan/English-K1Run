/* eslint-disable */
module.exports = {
  root: true,
  extends: ['@eslint/js/recommended'],
  ignorePatterns: ['dist', '.eslintrc.cjs', '*.md'],
  rules: {
    // Disable all inline style warnings
    'no-inline-styles': 'off',
    '@typescript-eslint/no-inline-styles': 'off',
    'react/no-inline-styles': 'off',
    'react/forbid-component-props': 'off',
    'react/forbid-dom-props': 'off',
    // Disable any style-related rules
    'no-style-tags': 'off',
    'style/*': 'off',
    // Disable warnings from unknown rules
    'import/no-unresolved': 'off',
    'import/extensions': 'off'
  },
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  globals: {
    React: 'readonly'
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        // Disable all style-related rules for TypeScript files
        'no-inline-styles': 'off',
        '@typescript-eslint/no-inline-styles': 'off',
        'react/no-inline-styles': 'off',
        'react/forbid-component-props': 'off',
        'react/forbid-dom-props': 'off'
      }
    },
    {
      files: ['*.md', '*.markdown'],
      rules: {
        // Disable markdown linting rules
        'MD001': 'off',
        'MD009': 'off',
        'MD026': 'off',
        'MD031': 'off',
        'MD032': 'off',
        'MD022': 'off'
      }
    }
  ]
}
