![npm type definitions](https://img.shields.io/npm/types/@kingsquare/kmt-cachebuster-webpack-plugin?style=flat-square)
![npm peer dependency version (scoped)](https://img.shields.io/npm/dependency-version/@kingsquare/kmt-cachebuster-webpack-plugin/dev/eslint-config-kingsquare?style=flat-square)
![Scrutinizer code quality (GitHub/Bitbucket)](https://img.shields.io/scrutinizer/quality/g/kingsquare/kmt-cachebuster-webpack-plugin?style=flat-square)
![Scrutinizer coverage (GitHub/BitBucket)](https://img.shields.io/scrutinizer/coverage/g/kingsquare/kmt-cachebuster-webpack-plugin?style=flat-square)

![node support](https://img.shields.io/node/v/@kingsquare/kmt-cachebuster-webpack-plugin?style=flat-square)
![webpack support](https://img.shields.io/badge/webpack->3_<=4-brightgreen?style=flat-square)

![GitHub package.json version](https://img.shields.io/github/package-json/v/kingsquare/kmt-cachebuster-webpack-plugin?style=flat-square)
![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/kingsquare/kmt-cachebuster-webpack-plugin?style=flat-square)
![GitHub release (latest SemVer including pre-releases)](https://img.shields.io/github/v/release/kingsquare/kmt-cachebuster-webpack-plugin?style=flat-square)
![GitHub Release Date](https://img.shields.io/github/release-date/kingsquare/kmt-cachebuster-webpack-plugin?style=flat-square)
![npm (scoped)](https://img.shields.io/npm/v/@kingsquare/kmt-cachebuster-webpack-plugin?style=flat-square)

# KMT Cachebuster Webpack plugin

Rewrites assets with hashes to assets without hashes compatible with KMT cachebusting.
Generates cachebuster manifests compatible with KMT from webpack assets.

Generated assets in the form of `asset.kmtWEBPACKHASH.js` will be renamed to `asset.js` and the hash is added to the `manifest.json`

## Usage

    yarn add @kingsquare/kmt-cachebuster-webpack-plugin

Or

    npm i @kingsquare/kmt-cachebuster-webpack-plugin

Then add the plugin to your webpack configuration

````javascript
const KmtCachebusterWebpackPlugin = require('@kingsquare/kmt-cachebuster-webpack-plugin');
````

### Configuration

````javascript
const config = {
  output: {
    filename: "app.kmt[contenthash:8].js",
    chunkFilename: "app.chunk[name].kmt[contenthash:8].js"
  },
  plugins: [
    new KmtCachebusterWebpackPlugin()
  ]
};
````

Setting the entry/asset `filename`/`chunkFilename` to `[name].kmt[chunkhash:8].js` should be done. This ensures that possible maps and/or code split assets will load with the correct hash (which is embedded in the generated webpack bootstrap)

### Usage with Encore

As you can not easily change the entry/asset `filename`/`chunkFilename` in [Encore](https://github.com/symfony/webpack-encore), [or do not want to](https://symfony.com/doc/current/frontend/encore/advanced-config.html). You will have to use the following configuration to get the correct assets for KMT.

````javascript

Encore
  // ... and lastly
  .addPlugin(
    new KmtWebpackPluginCachebuster({
      hashPrefix: ""
    }),
    42 // A priority that no one knows if it is the last
  );
````

Generated assets in the form of `asset.WEBPACKHASH.js` will be renamed to `asset.js` and the hash is added to the `manifest.json`

## Compatibility

 * [x] Webpack 3
 * [x] Webpack 4
 * [ ] Webpack 5

