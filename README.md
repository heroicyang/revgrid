# Hypegrid

[![NPM version](https://img.shields.io/npm/v/hypegrid)](https://www.npmjs.com/package/hypegrid) [![License](https://img.shields.io/github/license/hypegrid/hypegrid)](https://img.shields.io/github/license/hypegrid/hypegrid)

## What is Hypegrid?

Hypegrid is an ultra-fast HTML5 grid presentation layer, achieving its speed by rendering (in a canvas tag) only the currently visible portion of your (virtual) grid, thus avoiding the latency and life-cycle issues of building, walking, and maintaining a complex DOM structure.

It is a TypeScript port of [Fin Hypergrid Core](https://github.com/fin-hypergrid/core) based on the 
[EclipseTrading](https://github.com/EclipseTrading/hypergrid) fork of Hypergrid core.  All hypergrid dependencies are included within Hypegrid as part of the TypeScript port.

## Installation / Usage

### Library
Hypegrid is shipped via NPM. Use the following commands to install it into an application package:\
`npm i hypegrid`

### Source
The source can be installed by cloning the repository at:\
`https://github.com/hypegrid/hypegrid`

To build the distribution locally, open a shell at the directory/folder in which hypegrid was cloned and run the following commands:
1. `npm install` or `npm ci` (recommended) to install required dependencies
1. `npm run dist` to generate the distribution (`dist` subfolder). This script will:
    * delete the existing `lib` and `dist` folders
    * compile the TypeScript code
    * generate the rolled up TypeScript definition files (`index.d.ts` and `golden-layout-untrimmed.d.ts`)
    * generate source map
    * copy the style files to the `dist` folder

Note that the `lib` subfolder only holds the TypeScript declaration files generated by the compiler. Generally this subfolder can be ignored. It is used during the build process to generate the rolled up TypeScript definition files.

### Build and run demo/test app

After installing the source and building the distribution, you can build and start the `apitest` (demo) app to view the library in action. Use the following commands:
* `npm run testapp:build` to just build it
* `npm run testapp:serve` to both build and start the development server.\
You can then view it in your browser using the following link:\
http://localhost:3000/

### Building single-file bundles

UMD and ESM single file bundles can be generated for easier consumption without toolchain in-place. To do this, run `npm run bundles`, afterwards find the bundled files under `dist/bundles/`.
Bundles are not built by default and are not included in the NPM package. It is recommended to consume the library through NPM and webpack.

### Debugging Hypergrid

The `testapp` application can be used to debug the Golden Layout library.  Its `webpack` configuration will import the Hypegrid library source map, allowing debuggers to step through the library source code and place break points.

If you wish to test the library with other applications, you can link to the Hypegrid repository without having to install it into the application from NPM.  This is done with the `npm link` command.  Use the following steps:
1. Run the `npm link` from a shell in the hypegrid source repository top level folder.
1. Run `npm link hypegrid` from a shell in your application's top level folder.

Your application will then use the distribution in the hypegrid repository `dist` subfolder. If you wish to make changes to the Hypegrid library, you will need to run the `api` npm script to regenerate the `dist` folder.

Run `npm install` to remove the npm link.

## More Information

More information can be found at the [**Hypegrid website**](https://hypegrid.github.io/hypegrid/).

### Distribution

#### npm module _(recommended)_
Published as a CommonJS module to [**npm**](http://npmjs.com/package/@eclipsetrading/hypergrid).
Specify a <a href="https://semver.org/">SEMVER</a> of `"fin-hypergrid": "3.3.2"` (or `"^3.3.2"`) in your package.json file,
issue the `npm install` command, and let your bundler (<a target="webpack" href="https://webpack.js.org/">wepback</a>,
<a target="browserify" href="http://browserify.org/">Browserify</a>) create a single file containing both Hypergrid and your application.

#### Build files
For small and informal examples and proofs-of-concept, load a pre-bundled build file (`fin-hypergrid.js` or `fin-hypergrid.min.js`) from the GitHub CDN. See the [CDN index](https://fin-hypergrid.github.io#index) for links.

Your application can load one of these pre-bundled build files (in a `<script>` tag), which creates the global namespace `window.fin` (as needed) and populates it with `window.fin.Hypergrid`.

As of v3.2.1, the same build files are also available in a `umd` folder on npm for distribution via the [**unpkg**](https://unpkg.com/) CDN which processes SEMVER semantics when provided. For example, `<script src="https://unpkg.com/fin-hypergrid@^3.2/umd/fin-hypergrid.min.js"></script>` loads v3.3.2 which is the greatest (most recent) version number matching the SEMVER pattern `^3.2` (aka 3.*.*).

### Testing

Please use github [issues](https://github.com/fin-hypergrid/core/issues/new) to report problems

We invite everyone to test the alpha branch for changes going into the next release

Find more information on our [testing page](TESTING.md)

### Developer Documentation

Primarily our tutorials will be on the [wiki](https://github.com/fin-hypergrid/core/wiki).

We also maintain versioned [online API documentation](https://fin-hypergrid.github.io/core/2.1.15/doc/Hypergrid.html) for all public objects and modules. This documentation is necessarily an on-going work-in-progress.

(Cell editor information can be found [here](https://github.com/fin-hypergrid/core/wiki/Cell-Editors).)

(Cell Rendering information can be found [here](https://github.com/fin-hypergrid/core/wiki/Cell-Renderers).)

Hypergrid global configurations can be found [here](https://fin-hypergrid.github.io/core/2.1.15/doc/module-defaults.html).

### Contributors

Developers interested in contributing to this project should review our [contributing guide](CONTRIBUTING.md) before making pull requests.
