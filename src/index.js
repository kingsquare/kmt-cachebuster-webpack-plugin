const fs = require("fs");
const path = require("path");

// TODO v4

// TODO fix hash beforeEmit

// TODO replace should match filename i.e. `filename: '[name].[chunkhash:8].js'`

// TODO replace should match chunkFilename `i.e. chunkFilename: '[id].[chunkhash:8].js'`

class KmtWebpackPluginCachebuster {
  constructor(options) {
    this.options = Object.assign(
      {
        // no custom options yet
      },
      options || {}
    );
  }

  apply(compiler) {
    this.outputFolder = compiler.options.output.path;
    this.publicPath = compiler.options.output.publicPath;

    if (!compiler.hooks) {
      // webpack <= 3
      compiler.plugin("done", this.done.bind(this));
      return;
    }
    const pluginOptions = {
      name: "KmtWebpackPluginCachebuster",
      stage: Infinity
    };
    compiler.hooks.done.tap(pluginOptions, this.done.bind(this));
  }

  done(stats) {
    const rewrites = [];
    stats.toJson().assets.forEach(asset => {
      // 1) rewrite assets with hashes to assets without hashes
      //    we limit the hash size to 8 (the encore default) to reduce false positives
      const newFileName = asset.name.replace(/^(.*)(\.([a-z0-9]{8}))\.(.*)$/i, "$1.$4");
      if (newFileName !== asset.name) {
        rewrites.push(`${this.publicPath.substring(1)}${newFileName}`); // remove starting slash..
        fs.renameSync(path.resolve(this.outputFolder, asset.name), path.resolve(this.outputFolder, newFileName));
      }
      // 2) rewrite manifest.json entries; this could also be done by the manifest generator options,
      //    though doing it here this keeps the amount of specific code to one enclosed block.
      //    Assumed is that the manifest.json is the last file (so we know what we should rewrite)
      //    We also check that the "manifest.json" actually contains assets that have been rewritten.
      //    TODO detect that manifest.json is the WebpackManifest and not another manifest.json (i.e. pwa)
      if (asset.name === "manifest.json") {
        const manifestPath = path.resolve(this.outputFolder, asset.name);
        // eslint-disable-next-line import/no-dynamic-require,global-require
        const manifest = require(manifestPath);
        Object.keys(manifest).forEach(key => {
          if (rewrites.indexOf(key) !== -1) {
            manifest[key] = manifest[key].replace(/^(.*)\.(.*)\.(.*)$/, "$1.kmt$2.$3");
          }
        });
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      }
    });
  }
}

module.exports = KmtWebpackPluginCachebuster;
