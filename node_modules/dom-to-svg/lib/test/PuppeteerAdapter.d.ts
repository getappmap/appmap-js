import PollyAdapter from '@pollyjs/adapter';
import { Polly, Request as PollyRequest } from '@pollyjs/core';
import type * as Puppeteer from 'puppeteer';
interface PollyResponse {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    isBinary: boolean;
}
/**
 * A Puppeteer adapter for Polly that supports all request resource types.
 *
 * TODO: upstream this?
 *
 * Polly's own Puppeteer adapter hangs when attempting to capture the page's initial document
 * (requestResourceType==='document'). See https://github.com/Netflix/pollyjs/issues/121
 *
 * Its very complex internal flow makes it hard to modify/fix. The internal flow of this adapter is much simpler,
 * and handles all request resource types.
 *
 */
export declare class PuppeteerAdapter extends PollyAdapter {
    private subscriptions;
    /**
     * The puppeteer Page this adapter is attached to, obtained from
     * options passed to the Polly constructor.
     */
    private page;
    /**
     * The request resource types this adapter should intercept.
     */
    private requestResourceTypes;
    /**
     * A map of all intercepted requests to their respond function, which will be called by the
     * 'response' event listener, causing Polly to record the response content.
     */
    private pendingRequests;
    /**
     * Maps passthrough requests to an object containing:
     * - The response promise, which will be awaited in this.onPassthrough
     * - A respond function, called by 'response' event listener, which resolves the response promise.
     */
    private passThroughRequests;
    /**
     * The adapter's ID, used to reference it in the Polly constructor.
     */
    static get id(): string;
    constructor(polly: Polly);
    /**
     * Called when connecting to a Puppeteer page. Sets up request and response interceptors.
     */
    onConnect(): void;
    /**
     * Called when disconnecting from a Puppeteer.page.
     */
    onDisconnect(): void;
    /**
     * Given a request that should be allowed to pass through (not be intercepted),
     * return a Promise of the Response for that request, which will be passed to
     * request.respond().
     */
    passthroughRequest(pollyRequest: PollyRequest): Promise<PollyResponse>;
    /**
     * Responds to an intercepted request with the given response.
     *
     * If an error happened when retreiving the response, abort the request.
     */
    respondToRequest(pollyRequest: {
        requestArguments: {
            request: Puppeteer.Request;
        };
        response: PollyResponse;
    }, error?: unknown): Promise<void>;
    /**
     * Called when a request is intercepted, for all requests (passthrough or stubbed).
     *
     * Adds an entry to pendingRequests, that will call the provided promise.resolve function
     * when a response for this request is received.
     */
    onRequest({ requestArguments: { request }, promise, }: {
        requestArguments: {
            request: Puppeteer.Request;
        };
        promise: {
            resolve: (response: PollyResponse) => void;
        };
    }): void;
}
export {};
//# sourceMappingURL=PuppeteerAdapter.d.ts.map