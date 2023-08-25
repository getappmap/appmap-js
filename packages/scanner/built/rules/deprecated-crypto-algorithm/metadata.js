"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.labels = void 0;
exports.labels = ['crypto.encrypt', 'crypto.decrypt', 'crypto.digest'];
exports.default = {
    title: 'Deprecated cryptographic algorithm',
    scope: 'root',
    enumerateScope: true,
    impactDomain: 'Security',
    references: {
        'A02:2021': 'https://owasp.org/Top10/A02_2021-Cryptographic_Failures/',
    },
    labels: exports.labels,
};
