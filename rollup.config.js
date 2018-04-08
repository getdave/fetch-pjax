import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import copy from 'rollup-plugin-copy';
import pkg from './package.json';

export default [
	// browser-friendly UMD build
	{
		input: 'src/fetch-pjax.js',
		output: {
			name: 'FetchPjax',
			file: pkg.browser,
			format: 'umd'
		},
		plugins: [
			resolve({
				module: true
			}), // so Rollup can find `ms`
			commonjs({
				include: 'node_modules/**'
			}),
			copy({
				'dist/fetch-pjax.umd.js': 'server/fetch-pjax.js',
				verbose: true
			})
		]
	},

	// CommonJS (for Node) and ES module (for bundlers) build.
	// (We could have three entries in the configuration array
	// instead of two, but it's quicker to generate multiple
	// builds from a single configuration where possible, using
	// an array for the `output` option, where we can specify
	// `file` and `format` for each target)
	{
		input: 'src/fetch-pjax.js',
		external: [
			'assign-deep',
			'domify',
			'lodash.bindall',
			'lodash.curry',
			'lodash.isnil',
			'lodash.isempty',
			'lodash.isstring',
			'url-search-params-polyfill'
		],
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' }
		]
	}
];
