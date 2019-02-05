const path = require('path')

module.exports = {
	mode: 'development',
	entry: path.resolve('src/index.tsx'),
	output: {
		path: path.resolve('dist'),
		filename: 'index.js',
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				exclude: /node_modules/,
				use: {
					loader: 'ts-loader',
				}
			},
			{
				test: /\.png(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				use: 'url-loader'
			}
		]
	},
	resolve: {
		extensions: ['.json', '.ts', '.tsx', '.js', '.jsx'],
		alias: {
			react: path.resolve(__dirname, 'node_modules/react'),
			'pixi.js': path.resolve(__dirname, 'node_modules/pixi.js'),
			'react-pixi-fiber': path.resolve(__dirname, 'node_modules/react-pixi-fiber')
		}
	}
}