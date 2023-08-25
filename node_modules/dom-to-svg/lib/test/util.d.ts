import { Page } from 'puppeteer';
export declare const createDeferred: <T>() => {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (value: unknown) => void;
};
export declare function forwardBrowserLogs(page: Page): void;
export declare function readFileOrUndefined(filePath: string): Promise<string | undefined>;
//# sourceMappingURL=util.d.ts.map