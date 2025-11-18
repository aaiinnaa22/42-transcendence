import globals from "globals";
import tseslint from "typescript-eslint";
import json from "@eslint/json";
import { defineConfig } from "eslint/config";

export default defineConfig( [
	{
		files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
		extends: [
			  tseslint.configs.recommended,
		],
		languageOptions: {
			ecmaVersion: 2020,
			globals: {...globals.browser, ...globals.node}
		},
		rules: {
			// --- General formatting ---
			"max-len": ["error", { code: 120, ignoreComments: true }],
			indent: ["error", "tab", { SwitchCase: 1 }],
			"no-tabs": "off",
			"brace-style": ["error", "allman", { allowSingleLine: true }],
			"curly": ["error", "multi-line"],
			"semi": ["error", "always"],
			"quotes": ["error", "double"],

			// --- Spacing ---
			"space-in-parens": ["error", "always"],
			"array-bracket-spacing": ["error", "never"],
			"space-before-blocks": ["error", "always"],
			"keyword-spacing": ["error", { before: true, after: true }],
			"space-infix-ops": "error",

			// --- Function and parameter layout ---
			"function-paren-newline": ["error", "multiline"],
			"function-call-argument-newline": ["error", "consistent"],

			// --- Declarations and assignments alignment (approximation) ---
			"no-multi-spaces": ["error", { exceptions: { "VariableDeclarator": true } }],

			// --- Conditionals ---
			"one-var": ["error", "never"],
			"multiline-ternary": ["error", "always-multiline"],
			"nonblock-statement-body-position": ["error", "below"],

			// --- Misc ---
			"no-trailing-spaces": "error",
			"eol-last": ["error", "always"],
			"@typescript-eslint/no-explicit-any": "off",
		}
	},
	{ files: ["**/*.json"], plugins: { json }, language: "json/json" },
	{ files: ["**/*.jsonc"], plugins: { json }, language: "json/jsonc" },
] );
