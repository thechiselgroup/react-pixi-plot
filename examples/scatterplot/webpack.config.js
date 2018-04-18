const path = require('path')

module.exports = {
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
		extensions: ['.json', '.ts', '.tsx', '.js', '.jsx']
	}
}