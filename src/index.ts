import { Compiler, Plugin, Stats } from "webpack";

const fs = require("fs");
const path = require("path");

const PLUGIN_ID = "KmtWebpackPluginCachebuster";

namespace KmtWebpackPluginCachebuster {
  /**
   * Options for the KMT Cachebuster Webpack plugin
   */
  export interface Options {
    prefix?: string;
    hashSize?: number;
    manifest?: {
      rewriteEntries?: boolean;
      fileName?: string;
    };
  }
}

/**
 * KmtWebpackPluginCachebuster
 *
 * ...
 *
 * Options description in README.md
 */
class KmtWebpackPluginCachebuster implements Plugin {
  private readonly options: KmtWebpackPluginCachebuster.Options = {
    prefix: ".kmt",
    manifest: {
      rewriteEntries: true,
      fileName: "manifest.json"
    }
  };

  private outputFolder: string = "";
  private publicPath: string = "";

  constructor(options?: KmtWebpackPluginCachebuster.Options) {
    this.options = Object.assign(this.options, options || {});
  }

  apply(compiler: Compiler): void {
    this.outputFolder = compiler.options.output?.path ?? "";
    this.publicPath = compiler.options.output?.publicPath ?? "";

    if (!compiler.hooks) {
      // webpack <= 3
      // @ts-ignore
      compiler.plugin("done", this.done.bind(this));
      return;
    }

    compiler.hooks.done.tap(
      // the tapable v1 types are incorrect as fn, context & type are optional so we ignore this error
      // @ts-ignore
      {
        name: PLUGIN_ID,
        stage: Infinity
      },
      this.done.bind(this)
    );
  }

  done(stats: Stats) {
    const rewrites: string[] = [];
    (stats.toJson().assets ?? []).forEach(asset => {
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
      if (this.options.manifest?.rewriteEntries && asset.name === this.options.manifest.fileName) {
        const manifestPath = path.resolve(this.outputFolder, asset.name);
        // eslint-disable-next-line import/no-dynamic-require,global-require
        const manifest = require(manifestPath);
        Object.keys(manifest).forEach(key => {
          if (rewrites.indexOf(key) !== -1) {
            manifest[key] = manifest[key].replace(/^(.*)\.(.*)\.(.*)$/, `$1${this.options.prefix}$2.$3`);
          }
        });
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      }
    });
  }
}

export = KmtWebpackPluginCachebuster;
