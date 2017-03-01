var path = require('path');
var webpack = require('webpack');
var apiSetup = require('./src/api.js');

var conf_browser = {
	entry: './src/_main-browser.js',
	output: {
		path: path.resolve(__dirname, './www/'),
		publicPath: '', // ахтунг! это путь не на ФС, а из урла. Если он кривой, не открывается сокет-коннект (см. консоль) и следовательно не работает HMR
		filename: 'build-browser.js'
	},
	module: {
		rules: [{
			test: /\.vue$/,
			loader: 'vue-loader',
			// https://github.com/vuejs/vue-loader/blob/master/docs/en/options.md
			options: {
				loaders: {}
			}
		}, {
			test: /\.js$/,
			loader: 'babel-loader',
			exclude: /node_modules/
		}, {
			test: /\.(png|jpg|gif|svg)$/,
			loader: 'file-loader',
			options: {
				name: '[name].[ext]?[hash]'
			}
		}]
	},
	resolve: {
		alias: {
			'vue$': 'vue/dist/vue.common.js'
		}
	},
	devServer: {
		historyApiFallback: true,
		noInfo: false,
		contentBase: "www",
		setup: apiSetup
	},
	performance: {
		hints: false // 'error'
	},
	// https://webpack.github.io/docs/configuration.html#devtool
	devtool: '#eval-source-map'
}

// http://vue-loader.vuejs.org/en/workflow/production.html
if (process.env.NODE_ENV === 'production') {
	conf_browser.devtool = '#source-map';
	conf_browser.plugins = (conf_browser.plugins || []).concat([
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: '"production"'
			}
		}),
		new webpack.optimize.UglifyJsPlugin({
			sourceMap: true,
			compress: {
				warnings: false
			}
		}),
		new webpack.LoaderOptionsPlugin({
			minimize: true
		})
	])
}

module.exports = [conf_browser]; // , conf_server



/*

// HOWTO http://stackoverflow.com/questions/37369053/webpack-babel-config-for-both-server-and-client-javascript

var conf_server = {
	entry: './src/_main-server.js',
	target: 'node',
	output: {
		path: path.resolve(__dirname),
		libraryTarget: 'commonjs2',
		filename: 'build-server.js'
	},
	// https://webpack.github.io/docs/configuration.html#node
	node: {
		__dirname: false,
		__filename: false,
	},
	module: {
		rules: [{
			test: /\.vue$/,
			loader: 'vue-loader',
			// https://github.com/vuejs/vue-loader/blob/master/docs/en/options.md
			options: {
				loaders: {}
			}
		}, {
			test: /\.js$/,
			loader: 'babel-loader',
			exclude: /node_modules/
		}, {
			test: /\.(png|jpg|gif|svg)$/,
			loader: 'file-loader',
			options: {
				name: '[name].[ext]?[hash]'
			}
		}]
	}
}

const PATHS = {
	build: path.resolve(__dirname, '..', 'build'),
	sourcemaps: path.resolve(__dirname, '..', 'build', 'sourcemaps'),
	browserSource: path.resolve(__dirname, '..', 'src', 'browser', 'index.js'),
	browserBuild: path.resolve(__dirname, '..', 'build', 'browser'),
	serverSource: path.resolve(__dirname, '..', 'src', 'server', 'index.js'),
	serverAssetsSource: path.resolve(__dirname, '..', 'src', 'server', 'assets', 'index.js'),
	serverBuild: path.resolve(__dirname, '..', 'build', 'server'),
};

var conf_server_assets = {
	entry: {
		assets: PATHS.serverAssetsSource
	},
	target: 'node',
	output: {
		path: PATHS.browserBuild,
		libraryTarget: 'commonjs',
		filename: '../serverAssets/index.js',
		publicPath: '/',
	},
	plugins: [
		// assetsWriter,
		new CompressionPlugin({
			asset: '{file}.gz',
			algorithm: 'gzip',
			regExp: /\.js$|\.html$|\.css$|\.svg$|\.eot$|\.xml$/,
			threshold: 1400,
			minRation: 0.8,
		}),
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: JSON.stringify('production'),
				WEBPACK_ENV: JSON.stringify('assets'),
				APP_ENV: (process.env.APP_ENV && JSON.stringify(process.env.APP_ENV)) || undefined,
			},
		}),
	].concat(sharedPlugins),
	module: {
		loaders: [{
			test: /\.jsx?$/,
			exclude: /node_modules/,
			loader: 'babel',
		}, {
			test: /\.json$/,
			loader: 'json',
		}, {
			test: /\.(gif|png|jpe?g|svg|ico)$/i,
			loaders: [
				'url?limit=1400&name=s/i/[sha512:hash:base64:16].[ext]',
				'image-webpack?bypassOnDebug',
			],
		}, ],
	},
}*/