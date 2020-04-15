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
      const re = new RegExp(`^(.*)(\\.${this.options.prefix}([a-z0-9]{${this.options.hashSize}}))\\.(js|css)$`, "i");
      const newFileName = asset.name.replace(re, "$1.$4");
      if (newFileName !== asset.name) {
        manifest[`${this.publicPath.substring(1)}${newFileName}`] = `${this.publicPath}${asset.name}`; // remove starting slash..
        fs.renameSync(path.resolve(this.outputFolder, asset.name), path.resolve(this.outputFolder, newFileName));
      }
    });

    if (hasManifestPlugin && !this.options.manifest?.rewriteEntries) {
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
