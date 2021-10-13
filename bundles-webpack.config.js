/* eslint-disable */

const path = require('path');
const { SourceMapDevToolPlugin } = require('webpack');

const generateCommonConfig = (isDev) => ({
    entry: path.resolve(__dirname, 'src', 'code', 'public-api.ts'),
    resolve: {
        extensions: ['.ts'],
    },
    mode: isDev ? 'development' : 'production',
    devtool: false,
    plugins: isDev ? [new SourceMapDevToolPlugin({})] : [],
});

const generateTsLoaderBlock = (filename) => ({
    module: {
        rules: [
            {
                test: /.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        configFile: path.resolve(__dirname, filename),
                    },
                },
                exclude: /node_modules/,
            },
        ]
    },
});

const generateUmdConfig = (isDev) => {
    return {
        ...generateCommonConfig(isDev),
        ...generateTsLoaderBlock('tsconfig.esm.json'),
        output: {
            filename: isDev ? './bundles/umd/hypegrid.js' : './bundles/umd/hypegrid.min.js',
            library: {
                name: 'hypegrid',
                type: 'umd',
            }
        },
    }
}

const generateEsmConfig = (isDev) => {
    return {
        ...generateCommonConfig(isDev),
        ...generateTsLoaderBlock('tsconfig.esm.json'),
        output: {
            filename: isDev ? './bundles/esm/hypegrid.js' : './bundles/esm/hypegrid.min.js',
            library: {
                type: 'module',
            }
        },
        experiments: {
            outputModule: true,
        }
    }
};

module.exports = [
    generateUmdConfig(false),
    generateUmdConfig(true),
    generateEsmConfig(false),
    generateEsmConfig(true),
];
