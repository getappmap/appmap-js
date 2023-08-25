"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Labels = void 0;
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
const models_1 = require("@appland/models");
var Labels;
(function (Labels) {
    Labels["SignatureVerify"] = "jwt.signature.verify";
    Labels["JwtDecode"] = "jwt.decode";
})(Labels = exports.Labels || (exports.Labels = {}));
// Attempt to identify and return a JWT from an array of parameters
function findJwt(parameters) {
    if (!parameters)
        return;
    for (const param of parameters) {
        const tokens = param.value.split('.');
        if (tokens.length !== 3)
            return;
        const [header, payload, signature] = tokens;
        return { header, payload, signature };
    }
}
// Check if `obj` matches the JWT by value or by reference (receiverId)
function matchJwt(obj, jwt, receiverId) {
    const byValue = jwt !== undefined && obj.value.startsWith(`${jwt.header}.${jwt.payload}`);
    const byReference = receiverId !== undefined && receiverId === obj.object_id;
    return byValue || byReference;
}
class JwtUnverifiedSignatureLogic {
    matcher(event) {
        var _a, _b, _c;
        if (event.labels.has(Labels.SignatureVerify)) {
            // This method is marked both as decode and signature verify. It is compliant.
            return;
        }
        let verified = false;
        let receiverId;
        const jwt = findJwt(event.parameters);
        const matches = new Array();
        // Don't track the receiver if it's static. We'll find references of the decoded JWT passed by
        // function parameter instead.
        if (!event.isStatic) {
            receiverId = (_a = event.receiver) === null || _a === void 0 ? void 0 : _a.object_id;
        }
        for (const { event: child } of new models_1.EventNavigator(event).following()) {
            if (!child.labels.has(Labels.SignatureVerify)) {
                continue;
            }
            const matchesReceiver = receiverId !== undefined && receiverId === ((_b = child.receiver) === null || _b === void 0 ? void 0 : _b.object_id);
            const matchesParameter = (_c = child.parameters) === null || _c === void 0 ? void 0 : _c.find((param) => matchJwt(param, jwt, receiverId));
            if (matchesReceiver || matchesParameter) {
                verified = true;
                break;
            }
        }
        if (!verified) {
            matches.push({
                event,
                message: 'JWT signature is not validated',
            });
        }
        return matches;
    }
    where(event) {
        return event.labels.has('jwt.decode');
    }
}
class JwtUnverifiedSignature {
    constructor() {
        this.id = 'jwt-unverified-signature';
        this.title = 'Unverified signature';
        this.impactDomain = 'Security';
        this.enumerateScope = true;
        this.description = (0, parseRuleDescription_1.default)('jwtUnverifiedSignature');
        this.url = 'https://appland.com/docs/analysis/rules-reference.html#jwt-unverified-signature';
        this.labels = [Labels.JwtDecode, Labels.SignatureVerify];
        this.references = {
            'CWE-345': new URL('https://cwe.mitre.org/data/definitions/345.html'),
            'A02:2021': new URL('https://owasp.org/Top10/A02_2021-Cryptographic_Failures'),
            'RFC 7519': new URL('https://www.rfc-editor.org/rfc/rfc7519'),
        };
    }
    build() {
        return new JwtUnverifiedSignatureLogic();
    }
}
exports.default = new JwtUnverifiedSignature();
