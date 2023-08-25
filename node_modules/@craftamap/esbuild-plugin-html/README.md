# @craftamap/esbuild-plugin-html
[![npm](https://img.shields.io/npm/v/@craftamap/esbuild-plugin-html?color=green&style=flat-square)](https://www.npmjs.com/package/@craftamap/esbuild-plugin-html)

![Simple banner containing the name of the project in a html self-closing tag](.github/banner.png)

`@craftamap/esbuild-plugin-html` is a plugin to generate HTML files with
[esbuild](https://esbuild.github.io/).  All specified entry points, and their
related files (such as `.css`-files) are automatically injected into the HTML
file.  `@craftamap/esbuild-plugin-html` is inspired by
[jantimon/html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin).

Is any feature missing? 
[Please create a ticket.](https://github.com/craftamap/esbuild-plugin-html/issues/new)

## Requirements

This plugin requires at least `esbuild` v0.12.26. Development was done on
node.js 16, node.js 14 should also work though.

There is currently no deno version of this plugin - however, if there is need
for it, I will add one - 
[just open a issue.](https://github.com/craftamap/esbuild-plugin-html/issues/new)

## Installation

```bash
yarn add -D @craftamap/esbuild-plugin-html
# or
npm install --save-dev @craftamap/esbuild-plugin-html
```

## Usage

This plugin works by analyzing the
[`metafile`](https://esbuild.github.io/api/#metafile) esbuild provides. This
metafile contains information about all entryPoints and their output files.
This way, this plugin can map input files to their output file (javascript as
well as css).

`craftamap/esbuild-plugin-html` uses the [jsdom](https://github.com/jsdom/jsdom)
under the hood to create a model of your HTML from the provided template. In
this model, all discovered resources are injected. The plugin also uses [lodash
templates](https://lodash.com/docs/4.17.15#template) to insert custom user
data into the template.

`@craftamap/esbuild-plugin-html` requires to have some options set in your
esbuild script:

- `outdir` must be set. The html files are generated within the `outdir`.
- `metafile` must be set to `true`.

⚠️: you can set a specific output name for resources using esbuild's
`entryNames` feature. While this plugin tries to support this as best as it
can, it may or may not work reliable. If you encounter any issues with it, 
[please create a ticket.](https://github.com/craftamap/esbuild-plugin-html/issues/new)

### Sample Configuration

```javascript
const esbuild = require('esbuild');
const { htmlPlugin } = require('@craftamap/esbuild-plugin-html');

const options = {
    entryPoints: ['src/index.jsx'],
    bundle: true,
    metafile: true, // needs to be set
    outdir: 'dist/', // needs to be set
    plugins: [
        htmlPlugin({
            files: [
                {
                    entryPoints: [
                        'src/index.jsx',
                    ],
                    filename: 'index.html',
                    htmlTemplate: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body>
                <div id="root">
                </div>
            </body>
            </html>
          `,
                },
                {
                    entryPoints: [
                        'src/auth/auth.jsx',
                    ],
                    filename: 'auth.html',
                    title: 'Login',
                    scriptLoading: 'module',
                    favicon: './public/favicon.ico',
                },
                {
                    entryPoints: [
                        'src/installation/installation.jsx',
                    ],
                    filename: 'installation.html',
                    title: 'title',
                    scriptLoading: 'module',
                    define: {
                        "version": "0.3.0",
                    },
                    htmlTemplate: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body>
                You are using version <%- define.version %>
                <div id="root">
                </div>
            </body>
            </html>
          `,
                },
            ]
        })
    ]
}

esbuild.build(options).catch(() => process.exit(1))
```

### Configuration

```typescript
interface Configuration {
    files: HtmlFileConfiguration[],
}

interface HtmlFileConfiguration {
    filename: string,           // Output filename, e.g. index.html. This path is relative to the out dir
    entryPoints: string[],      // Entry points to inject into the created html file, e.g. ['src/index.jsx']. 
                                // Multiple entryPoints are possible.
    title?: string,             // title to inject into the head, will not be set if not specified
    htmlTemplate?: string,      // custom html document template string. If you omit a template, 
                                // a default template will be used (see below)
                                // can also be a relative path to an html file
    define?: Record<string, string>,
                                // Define custom values that can be accessed in the lodash template context
    scriptLoading?: 'blocking' | 'defer' | 'module', 
                                // Decide if the script tag will be inserted as blocking script tag, 
                                // with `defer=""` (default) or with `type="module"`
    favicon?: string,           // path to favicon.ico. If not specified, no favicon will be injected
    findRelatedOutputFiles?: boolean,
                                // Find related output (*.css)-files and inject them into the html. 
                                // Defaults to true.
    extraScripts?: (string | {  // accepts an array of src strings or objects with src and attributes
        src: string;            // src to use for the script
        attrs?: { [key: string]: string } // attributes to append to the script, e.g. { type: 'module', async: true }
    })[]
}
```

In case a `publicPath` is specified in the esbuild configuration,
`esbuild-plugin-html` will use absolute paths with the provided `publicPath`.

You can also change the verbosity of the plugin by changing esbuild's verbosity.

#### Default HTML template

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body>
  </body>
</html>
```

## Contributing

Contributions are always welcome. 

Currently `tsc` is used to build the project.

If you file a commit, please use the following commit pattern:

```
topic: description (#issueId)
```

For example:

```
README: Add banner to README.md (#2)
```


## Kudos: Other `*.html`-Plugins

There exist some other `*.html`-plugins for esbuild. Those work differently
than `@craftamap/esbuild-plugin-html`, and might be a better fit for you:

- [@esbuilder/html](https://www.npmjs.com/package/@esbuilder/html) -
  loader-based approach (use `*.html`-file as entry point, and start
  subprocesses with `esbuild`)
- [@chialab/esbuild-plugin-html](https://www.npmjs.com/package/@chialab/esbuild-plugin-html)
  - loader-based approach
