"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(args) {
    args.option('directory', {
        describe: 'program working directory',
        type: 'string',
        alias: 'd',
    });
    args.option('appmap-dir', {
        describe: 'directory to recursively inspect for AppMaps',
    });
    args.option('config', {
        describe: 'path to assertions config file (TypeScript or YAML, check docs for configuration format)',
        default: 'appmap-scanner.yml',
        alias: 'c',
    });
    args.option('report-file', {
        describe: 'file name for findings report',
        default: 'appmap-findings.json',
    });
    args.option('api-key', {
        describe: 'AppMap server API key. Use of this option is discouraged; set APPLAND_API_KEY instead',
    });
    args.option('app', {
        describe: 'name of the app to publish the findings for. By default, this is determined by looking in appmap.yml',
        alias: 'a',
    });
}
exports.default = default_1;
