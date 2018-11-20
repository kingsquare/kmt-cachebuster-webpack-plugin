# KMT Cachebuster Webpack plugin

Generates cachebuster manifests compatible with KMT from webpack assets.

## Usage

    npm i @kingsquare/kmt-cachebuster-webpack-plugin

Then add the plugin to your webpack configuration

````javascript
const KmtCachebusterWebpackPlugin = require('@kingsquare/kmt-cachebuster-webpack-plugin');

// ...

plugins: [
  new KmtCachebusterWebpackPlugin()
]
````

You should also set the entry/asset `filename`/`chunkFilename` to `[name].kmt[chunkhash:8].js` this ensures that possible maps and/or code split assets will load with the correct hash (which is embedded in the generated webpack bootstrap)

## Implementation

Rewrites assets with hashes to assets without hashes. Generated assets in the form of `asset.kmtWEBPACKHASH.js` will be renamed to `asset.js` and the cachebuster is added to the `manifest.json`
