import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';
import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import eslintPluginJsonc from 'eslint-plugin-jsonc';
import pluginReactConfig from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import autoImports from './.wxt/eslint-auto-imports.mjs';

export default defineConfig(
	eslint.configs.recommended,
	autoImports, // WXT configuration

	// TypeScript parser configuration
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				project: true,
			},
		},
	},

	// JavaScript and TypeScript configuration
	{
		files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			parserOptions: {
				ecmaFeatures: { jsx: true },
			},
		},
		extends: [

			// Use these before committing to check for more detailed errors (but is much slower)
			// ...tseslint.configs.recommendedTypeChecked,
			// ...tseslint.configs.stylisticTypeChecked,
			// Use these during development for speed improvements
			...tseslint.configs.recommended,
			...tseslint.configs.stylistic,

			pluginReactConfig.configs.flat['recommended'],
			pluginReactConfig.configs.flat['jsx-runtime'],
			stylistic.configs['recommended'],
		],
		plugins: {
			'react': pluginReactConfig,
			'@stylistic': stylistic,
			'react-hooks': eslintPluginReactHooks,
			'simple-import-sort': simpleImportSort,
		},
		rules: {
			// ESLint react-hooks recommended config
			...eslintPluginReactHooks.configs['recommended-latest'].rules,

			// Stylistic
			'@stylistic/no-tabs': 'off',
			'@stylistic/indent': ['warn', 'tab'],
			'@stylistic/jsx-indent': ['warn', 'tab'],
			'@stylistic/jsx-indent-props': ['warn', 'tab'],
			'@stylistic/semi': ['error', 'always'],
			'@stylistic/jsx-one-expression-per-line': 'off',
			'@stylistic/brace-style': ['error', '1tbs'],

			// JavaScript
			'prefer-template': 'error',
			'no-useless-assignment': 'error',

			// TypeScript
			'@typescript-eslint/no-unused-vars': 'warn',
			'@typescript-eslint/array-type': 'error',
			'@typescript-eslint/consistent-indexed-object-style': 'error',

			// React
			'react/react-in-jsx-scope': 'off',
			'react/no-children-prop': 'off',
			// Simple Import Sort
			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error',
		},
	},

	// JSON configuration
	{
		files: ['**/*.json'],
		extends: [...eslintPluginJsonc.configs['flat/recommended-with-json']],
		rules: {
			'jsonc/indent': ['warn', 'tab', {}],
			'jsonc/no-comments': 'off',
		},
	},

	// package.json specific rules
	{
		files: ['**/package.json'],
		rules: {
			'jsonc/no-comments': 'error',
			'jsonc/sort-keys': [
				'error',
				{
					pathPattern: '^$',
					order: [
						'name',
						'version',
						'private',
						'type',
						'publishConfig',
						'scripts',
						'dependencies',
						'devDependencies',
					],
				},
				{
					pathPattern: '^(?:dev|peer|optional|bundled)?[Dd]ependencies$',
					order: { type: 'asc' },
				},
			],
		},
	},

	// TailwindCSS configuration
	{
		files: ['**/*.{jsx,tsx}'],
		languageOptions: {
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		plugins: {
			'better-tailwindcss': betterTailwindcss,
		},
		rules: {
			...betterTailwindcss.configs['recommended-warn'].rules,
			'better-tailwindcss/enforce-consistent-line-wrapping': ['off'],
		},
		settings: {
			'better-tailwindcss': {
				entryPoint: 'src/assets/index.css',
			},
		},
	},
);
