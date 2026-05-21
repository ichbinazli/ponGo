const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/main.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
      publicPath: '/',
    },
    resolve: {
      extensions: ['.ts', '.js'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader',
          ],
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        inject: 'body',
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'src/frontend',
            to: 'frontend',
            noErrorOnMissing: true,
          },
          {
            from: 'src/3D-game',
            to: '3D-game',
            noErrorOnMissing: true,
          },
          {
            from: 'src/image',
            to: 'image',
            noErrorOnMissing: true,
          }
        ],
      }),
      ...(isProduction ? [new MiniCssExtractPlugin({
        filename: '[name].css',
      })] : []),
    ],
    devServer: {
      static: [
        {
          directory: path.join(__dirname, 'dist'),
        },
        {
          directory: path.join(__dirname, 'src/frontend'),
          publicPath: '/frontend',
        },
        {
          directory: path.join(__dirname, 'src'),
          publicPath: '/',
        }
      ],
      port: 5173,
      hot: true,
      historyApiFallback: true,
      open: false,
      host: '0.0.0.0',
      server: {
        type: 'https',
        options: {
          key: fs.readFileSync(path.join(__dirname, 'certs/key.pem')),
          cert: fs.readFileSync(path.join(__dirname, 'certs/cert.pem')),
        },
      },
      proxy: [
        {
          context: ['/api', '/uploads'],
          target: 'https://localhost:8443',
          secure: false,
          changeOrigin: true,
        },
      ],
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
  };
};