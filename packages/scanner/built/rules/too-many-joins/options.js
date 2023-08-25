"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Options {
    constructor() {
        this.warningLimit = 5;
        this.excludeTables = [
            { match: /^pg_/, ignoreCase: false },
            { equal: 'information_schema', ignoreCase: false },
        ];
    }
}
exports.default = Options;
