"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatReport = void 0;
// Formats a report to JSON. Does some data deduplication.
function formatReport(rawScanResults) {
    const { summary, appMapMetadata, findings } = Object.assign({}, rawScanResults);
    // remove metadata that's common between appmaps
    const filter = metadataFilter(summary.appMapMetadata);
    const metadata = Object.fromEntries(Object.entries(appMapMetadata).map(([id, metadata]) => [id, filter(metadata)]));
    // only keep one finding of the same hash
    const uniqueFindings = [...uniq(findings, ({ hash }) => hash)];
    return JSON.stringify(Object.assign(Object.assign({}, rawScanResults), { summary: Object.assign(Object.assign({}, summary), { numFindings: uniqueFindings.length }), appMapMetadata: metadata, findings: uniqueFindings }), null, 2);
}
exports.formatReport = formatReport;
function metadataFilter({ apps: { length: apps }, clients: { length: clients }, frameworks: { length: frameworks }, git: { length: git }, languages: { length: languages }, recorders: { length: recorders }, }) {
    const filtered = Object.entries({
        app: apps < 2,
        client: clients < 2,
        git: git < 2,
        language: languages < 2,
        recorder: recorders < 2,
    })
        .filter(([, v]) => v)
        .map(([k]) => k);
    return function (metadata) {
        return Object.fromEntries(Object.entries(metadata).filter(([k, v]) => {
            if (filtered.includes(k))
                return false;
            if (k === 'frameworks')
                return (v || []).length !== frameworks;
            return true;
        }));
    };
}
function uniq(entries, key) {
    const result = new Map();
    for (const entry of entries) {
        const k = key(entry);
        if (result.has(k))
            continue;
        result.set(k, entry);
    }
    return result.values();
}
