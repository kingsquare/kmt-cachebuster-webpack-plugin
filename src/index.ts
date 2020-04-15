import { Compiler, Plugin, Stats } from "webpack";

const fs = require("fs");
const path = require("path");

const PLUGIN_ID = "KmtWebpackPluginCachebuster";

namespace KmtWebpackPluginCachebuster {
  /**
   * Options for the KMT Cachebuster Webpack plugin
   */
  export interface Options {
    hashPrefix?: string;
    outputHashPrefix?: string;
    hashSize?: number;
    manifest?: {
      rewriteEntries?: boolean;
      fileName?: string;
    };
    debug?: boolean;
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
    hashPrefix: "kmt",
    outputHashPrefix: "kmt",
    /**
     * Also the encore default hash size
     */
    hashSize: 8,
    manifest: {
      rewriteEntries: true,
      fileName: "manifest.json"
    },
    debug: false
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
    const manifest: {
      [key: string]: string;
    } = {};

    const assets = stats.toJson().assets ?? [];

    if (assets.length === 0) {
      console.error(`[${PLUGIN_ID}] Could not find any assets`);
      return;
    }

    const hasManifestPlugin = assets.find(a => a.name === "manifest.json");

    assets.forEach(asset => {
      // rewrite assets with hashes to assets without hashes
      // we limit the hash size to 8 (the encore default) to reduce false positives
      const reString = `^(.*)(\\.${this.options.hashPrefix}([a-z0-9]{${this.options.hashSize}}))\\.(js|css)$`;
      if (this.options.debug) {
        console.log("re -> ", reString);
      }
      const re = new RegExp(reString, "i");
      const newFileName = asset.name.replace(re, "$1.$4");
      const prefixedAssetName = asset.name.replace(re, `$1.${this.options.outputHashPrefix}$3.$4`);
      if (this.options.debug) {
        console.log(asset.name, " -> ", newFileName, prefixedAssetName);
      }
      if (newFileName !== asset.name) {
        manifest[`${this.publicPath.substring(1)}${newFileName}`] = `${this.publicPath}${prefixedAssetName}`; // remove starting slash..
        fs.renameSync(path.resolve(this.outputFolder, asset.name), path.resolve(this.outputFolder, newFileName));
      }
    });

    if (hasManifestPlugin && !this.options.manifest?.rewriteEntries) {
      return;
    }

    if (Object.keys(manifest).length === 0) {
      console.error(`[${PLUGIN_ID}] Empty manifest`);
      return;
    }

    // create/overwrite manifest.json
    fs.writeFileSync(
      path.resolve(this.outputFolder, this.options.manifest?.fileName as string),
      JSON.stringify(manifest, null, 2)
    );
  }
}

export = KmtWebpackPluginCachebuster;
