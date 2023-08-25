"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(args) {
    args.option('branch', {
        describe: 'branch name of the code version',
        alias: 'b',
    });
    args.option('commit', {
        describe: 'commit SHA of the code version',
        alias: 'C',
    });
    args.option('environment', {
        describe: 'name of the environment in which the scan is performed (e.g. $HOSTNAME, ci, staging, etc)',
        alias: 'e',
    });
}
exports.default = default_1;
