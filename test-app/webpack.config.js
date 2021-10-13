// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require("webpack");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    entry: [
        path.resolve(__dirname, "styles.css"),
        path.resolve(__dirname, "index.ts"),
    ],

    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist/'),
    },

    devtool: 'cheap-module-source-map',

    devServer: {
        port: 3001,
    },

    resolve: {
        extensions: ['.ts', '.js'],
    },

    module: {
        rules: [
            {
                test: /.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        "configFile": "./tsconfig.json",
                    },
                },
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.js$/,
                enforce: 'pre',
                use: ['source-map-loader'],

            }
        ]
    },

    plugins: [
        new webpack.DefinePlugin({
            env: JSON.stringify(process.env)
        }),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, "index.html")
        }),
    ]
};
