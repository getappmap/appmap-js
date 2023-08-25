"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newFindings = void 0;
function newFindings(findings, findingStatuses) {
    const statusByFindingDigest = findingStatuses.reduce((memo, findingStatus) => {
        memo.set(findingStatus.identity_hash, findingStatus.status);
        return memo;
    }, new Map());
    return findings.filter((finding) => {
        const status = statusByFindingDigest.get(finding.hash);
        return !status || status === 'new';
    });
}
exports.newFindings = newFindings;
