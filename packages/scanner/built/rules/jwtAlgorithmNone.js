"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Labels = void 0;
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
const url_1 = require("url");
var Labels;
(function (Labels) {
    Labels["JwtEncode"] = "jwt.encode";
})(Labels = exports.Labels || (exports.Labels = {}));
function getHeader(jwt) {
    try {
        const [header] = jwt.split('.');
        const decodedHeader = Buffer.from(header, 'base64').toString('utf-8');
        return JSON.parse(decodedHeader);
    }
    catch (_a) {
        // the JWT is malformed
        return undefined;
    }
}
class JwtAlgoritmNoneLogic {
    matcher(event) {
        if (!event.returnValue)
            return;
        const matches = new Array();
        const { value: jwt } = event.returnValue;
        const header = getHeader(jwt);
        if ((header === null || header === void 0 ? void 0 : header.alg) === 'none') {
            matches.push({ event, message: 'Encoded JWT using the `none` algorithm' });
        }
        return matches;
    }
    where(event) {
        return event.labels.has(Labels.JwtEncode);
    }
}
class JwtAlgoritmNone {
    constructor() {
        this.id = 'jwt-algorithm-none';
        this.title = "JWT 'none' algorithm";
        this.impactDomain = 'Security';
        this.enumerateScope = true;
        this.description = (0, parseRuleDescription_1.default)('jwtAlgorithmNone');
        this.url = 'https://appland.com/docs/analysis/rules-reference.html#jwt-algorithm-none';
        this.labels = [Labels.JwtEncode];
        this.references = {
            'CWE-345': new url_1.URL('https://cwe.mitre.org/data/definitions/345.html'),
            'A02:2021': new url_1.URL('https://owasp.org/Top10/A02_2021-Cryptographic_Failures'),
            'RFC 7519': new url_1.URL('https://www.rfc-editor.org/rfc/rfc7519'),
        };
    }
    build() {
        return new JwtAlgoritmNoneLogic();
    }
}
exports.default = new JwtAlgoritmNone();
