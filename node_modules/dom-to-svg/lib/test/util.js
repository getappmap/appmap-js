import { readFile } from 'fs/promises';
export const createDeferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((resolve_, reject_) => {
        resolve = resolve_;
        reject = reject_;
    });
    return { promise, resolve, reject };
};
export function forwardBrowserLogs(page) {
    page.on('console', message => {
        console.log('Browser console:', message.type().toUpperCase(), message.text());
    });
    page.on('error', error => {
        console.error(error);
    });
    page.on('pageerror', error => {
        console.error(error);
    });
}
export async function readFileOrUndefined(filePath) {
    try {
        return await readFile(filePath, 'utf-8');
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return undefined;
        }
        throw error;
    }
}
//# sourceMappingURL=util.js.map