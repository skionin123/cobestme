import tseslint from 'typescript-eslint'

const files=['src/builder/**/*.{ts,tsx}','tests/builder-*.test.ts']

export default [
  {ignores:['dist/**','node_modules/**']},
  ...tseslint.configs.recommended.map(config=>({...config,files})),
  {
    files,
    rules:{
      '@typescript-eslint/no-explicit-any':'off',
      '@typescript-eslint/no-unused-vars':['warn',{argsIgnorePattern:'^_',varsIgnorePattern:'^_'}]
    }
  }
]
