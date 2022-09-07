const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const config = {
  entry: './src/index.mjs',
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },

  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    hot: true,
    proxy: {
      context: ['/coords', '/add', '/list'],
      target: 'http://localhost:3000',
    },
  },

  module: {
    rules: [
      {
        test: /\.html$/i,
        use: 'html-loader',
        exclude: /index.html/,
      },
      {
        test: /\.hbs$/,
        use: 'handlebars-loader',
      },
      {
        test: /\.s[ac]ss$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.(jpe?g|png|gif|ico)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[hash][ext][query]',
        },
      },
      {
        test: /\.svg$/,
        type: 'asset',
        generator: {
          filename: 'assets/icons/[hash][ext][query]',
        },
        use: 'svgo-loader',
      },
      {
        test: /\.(woff(2)?|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[hash][ext][query]',
        },
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({
      title: 'Геоотзыв',
      template: 'index.html',
    }),
    new MiniCssExtractPlugin({
      filename: 'style.css',
    }),
  ],
};

module.exports = (env, argv) => {
  if (argv.mode === 'development') {
    config.output.filename = '[name].js';
    config.devtool = 'source-map';
  }

  if (argv.mode === 'production') {
    config.output.filename = '[name].[chunkhash].js';
  }

  return config;
};
