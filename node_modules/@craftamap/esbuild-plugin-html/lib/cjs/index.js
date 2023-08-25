"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlPlugin = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const jsdom_1 = require("jsdom");
const lodash_template_1 = __importDefault(require("lodash.template"));
const defaultHtmlTemplate = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
  </head>
  <body>
  </body>
</html>
`;
const REGEXES = {
    DIR_REGEX: '(?<dir>\\S+\\/?)',
    HASH_REGEX: '(?<hash>[A-Z2-7]{8})',
    NAME_REGEX: '(?<name>[^\\s\\/]+)',
};
// This function joins a path, and in case of windows, it converts backward slashes ('\') forward slashes ('/').
function posixJoin(...paths) {
    const joined = path_1.default.join(...paths);
    if (path_1.default.sep === '/') {
        return joined;
    }
    return joined.split(path_1.default.sep).join(path_1.default.posix.sep);
}
function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
const htmlPlugin = (configuration = { files: [], }) => {
    configuration.files = configuration.files.map((htmlFileConfiguration) => {
        return Object.assign({}, { 'findRelatedOutputFiles': true }, htmlFileConfiguration); // Set default values
    });
    let logInfo = false;
    function collectEntrypoints(htmlFileConfiguration, metafile) {
        const entryPoints = Object.entries((metafile === null || metafile === void 0 ? void 0 : metafile.outputs) || {}).filter(([, value]) => {
            if (!value.entryPoint) {
                return false;
            }
            return htmlFileConfiguration.entryPoints.includes(value.entryPoint);
        }).map(outputData => {
            // Flatten the output, instead of returning an array, let's return an object that contains the path of the output file as path
            return { path: outputData[0], ...outputData[1] };
        });
        return entryPoints;
    }
    function findRelatedOutputFiles(entrypoint, metafile, entryNames) {
        var _a, _b;
        const pathOfMatchedOutput = path_1.default.parse(entrypoint.path);
        // Search for all files that are "related" to the output (.css and map files, for example files, as assets are dealt with otherwise).
        if (entryNames) {
            // If entryNames is set, the related output files are more difficult to find, as the filename can also contain a hash.
            // The hash could also be part of the path, which could make it even more difficult
            // We therefore try to extract the dir, name and hash from the "main"-output, and try to find all files with
            // the same [name] and [dir].
            // This should always include the "main"-output, as well as all relatedOutputs
            const joinedPathOfMatch = posixJoin(pathOfMatchedOutput.dir, pathOfMatchedOutput.name);
            const findVariablesRegexString = escapeRegExp(entryNames)
                .replace('\\[hash\\]', REGEXES.HASH_REGEX)
                .replace('\\[name\\]', REGEXES.NAME_REGEX)
                .replace('\\[dir\\]', REGEXES.DIR_REGEX);
            const findVariablesRegex = new RegExp(findVariablesRegexString);
            const match = findVariablesRegex.exec(joinedPathOfMatch);
            const name = (_a = match === null || match === void 0 ? void 0 : match.groups) === null || _a === void 0 ? void 0 : _a['name'];
            const dir = (_b = match === null || match === void 0 ? void 0 : match.groups) === null || _b === void 0 ? void 0 : _b['dir'];
            return Object.entries((metafile === null || metafile === void 0 ? void 0 : metafile.outputs) || {}).filter(([pathOfCurrentOutput,]) => {
                if (entryNames) {
                    // if a entryName is set, we need to parse the output filename, get the name and dir, 
                    // and find files that match the same criteria
                    const findFilesWithSameVariablesRegexString = escapeRegExp(entryNames.replace('[name]', name !== null && name !== void 0 ? name : '').replace('[dir]', dir !== null && dir !== void 0 ? dir : ''))
                        .replace('\\[hash\\]', REGEXES.HASH_REGEX);
                    const findFilesWithSameVariablesRegex = new RegExp(findFilesWithSameVariablesRegexString);
                    return findFilesWithSameVariablesRegex.test(pathOfCurrentOutput);
                }
            }).map(outputData => {
                // Flatten the output, instead of returning an array, let's return an object that contains the path of the output file as path
                return { path: outputData[0], ...outputData[1] };
            });
        }
        else {
            // If entryNames is not set, the related files are always next to the "main" output, and have the same filename, but the extension differs
            return Object.entries((metafile === null || metafile === void 0 ? void 0 : metafile.outputs) || {}).filter(([key,]) => {
                return path_1.default.parse(key).name === pathOfMatchedOutput.name && path_1.default.parse(key).dir === pathOfMatchedOutput.dir;
            }).map(outputData => {
                // Flatten the output, instead of returning an array, let's return an object that contains the path of the output file as path
                return { path: outputData[0], ...outputData[1] };
            });
        }
    }
    async function renderTemplate({ htmlTemplate, define }) {
        const template = (htmlTemplate && fs_1.default.existsSync(htmlTemplate)
            ? await fs_1.default.promises.readFile(htmlTemplate)
            : htmlTemplate || '').toString();
        const compiledTemplateFn = (0, lodash_template_1.default)(template || defaultHtmlTemplate);
        return compiledTemplateFn({ define });
    }
    // use the same joinWithPublicPath function as esbuild:
    //  https://github.com/evanw/esbuild/blob/a1ff9d144cdb8d50ea2fa79a1d11f43d5bd5e2d8/internal/bundler/bundler.go#L533
    function joinWithPublicPath(publicPath, relPath) {
        relPath = path_1.default.normalize(relPath);
        if (!publicPath) {
            publicPath = '.';
        }
        let slash = '/';
        if (publicPath.endsWith('/')) {
            slash = '';
        }
        return `${publicPath}${slash}${relPath}`;
    }
    function injectFiles(dom, assets, outDir, publicPath, htmlFileConfiguration) {
        const document = dom.window.document;
        for (const script of (htmlFileConfiguration === null || htmlFileConfiguration === void 0 ? void 0 : htmlFileConfiguration.extraScripts) || []) {
            const scriptTag = document.createElement('script');
            if (typeof script === 'string') {
                scriptTag.setAttribute('src', script);
            }
            else {
                scriptTag.setAttribute('src', script.src);
                Object.entries(script.attrs || {}).forEach(([key, value]) => {
                    scriptTag.setAttribute(key, value);
                });
            }
            document.body.append(scriptTag);
        }
        for (const outputFile of assets) {
            const filepath = outputFile.path;
            let targetPath;
            if (publicPath) {
                targetPath = joinWithPublicPath(publicPath, path_1.default.relative(outDir, filepath));
            }
            else {
                const htmlFileDirectory = posixJoin(outDir, htmlFileConfiguration.filename);
                targetPath = path_1.default.relative(path_1.default.dirname(htmlFileDirectory), filepath);
            }
            const ext = path_1.default.parse(filepath).ext;
            if (ext === '.js') {
                const scriptTag = document.createElement('script');
                scriptTag.setAttribute('src', targetPath);
                if (htmlFileConfiguration.scriptLoading === 'module') {
                    // If module, add type="module"
                    scriptTag.setAttribute('type', 'module');
                }
                else if (!htmlFileConfiguration.scriptLoading || htmlFileConfiguration.scriptLoading === 'defer') {
                    // if scriptLoading is unset, or defer, use defer
                    scriptTag.setAttribute('defer', '');
                }
                document.body.append(scriptTag);
            }
            else if (ext === '.css') {
                const linkTag = document.createElement('link');
                linkTag.setAttribute('rel', 'stylesheet');
                linkTag.setAttribute('href', targetPath);
                document.head.appendChild(linkTag);
            }
            else {
                logInfo && console.log(`Warning: found file ${targetPath}, but it was neither .js nor .css`);
            }
        }
    }
    return {
        name: 'esbuild-html-plugin',
        setup(build) {
            build.onStart(() => {
                if (!build.initialOptions.metafile) {
                    throw new Error('metafile is not enabled');
                }
                if (!build.initialOptions.outdir) {
                    throw new Error('outdir must be set');
                }
            });
            build.onEnd(async (result) => {
                const startTime = Date.now();
                if (build.initialOptions.logLevel == 'debug' || build.initialOptions.logLevel == 'info') {
                    logInfo = true;
                }
                logInfo && console.log();
                for (const htmlFileConfiguration of configuration.files) {
                    // First, search for outputs with the configured entryPoints
                    const collectedEntrypoints = collectEntrypoints(htmlFileConfiguration, result.metafile);
                    // All output files relevant for this html file
                    let collectedOutputFiles = [];
                    for (const entrypoint of collectedEntrypoints) {
                        if (!entrypoint) {
                            throw new Error(`Found no match for ${htmlFileConfiguration.entryPoints}`);
                        }
                        let relatedOutputFiles;
                        if (htmlFileConfiguration.findRelatedOutputFiles) {
                            relatedOutputFiles = findRelatedOutputFiles(entrypoint, result.metafile, build.initialOptions.entryNames);
                        }
                        else {
                            relatedOutputFiles = [entrypoint];
                        }
                        collectedOutputFiles = [...collectedOutputFiles, ...relatedOutputFiles];
                    }
                    // Note: we can safely disable this rule here, as we already asserted this in setup.onStart
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const outdir = build.initialOptions.outdir;
                    const publicPath = build.initialOptions.publicPath;
                    const templatingResult = await renderTemplate(htmlFileConfiguration);
                    // Next, we insert the found files into the htmlTemplate - if no htmlTemplate was specified, we default to a basic one.
                    const dom = new jsdom_1.JSDOM(templatingResult);
                    const document = dom.window.document;
                    if (htmlFileConfiguration.title) {
                        // If a title was given, we pass the title as well
                        document.title = htmlFileConfiguration.title;
                    }
                    if (htmlFileConfiguration.favicon) {
                        // Injects a favicon if present
                        await fs_1.default.promises.copyFile(htmlFileConfiguration.favicon, `${outdir}/favicon.ico`);
                        const linkTag = document.createElement('link');
                        linkTag.setAttribute('rel', 'icon');
                        linkTag.setAttribute('href', '/favicon.ico');
                        document.head.appendChild(linkTag);
                    }
                    injectFiles(dom, collectedOutputFiles, outdir, publicPath, htmlFileConfiguration);
                    const out = posixJoin(outdir, htmlFileConfiguration.filename);
                    await fs_1.default.promises.mkdir(path_1.default.dirname(out), {
                        recursive: true,
                    });
                    await fs_1.default.promises.writeFile(out, dom.serialize());
                    const stat = await fs_1.default.promises.stat(out);
                    logInfo && console.log(`  ${out} - ${stat.size}`);
                }
                logInfo && console.log(`  HTML Plugin Done in ${Date.now() - startTime}ms`);
            });
        }
    };
};
exports.htmlPlugin = htmlPlugin;
