export declare class NetworkStatsbeat {
    time: number;
    lastTime: number;
    endpoint: number;
    host: string;
    totalRequestCount: number;
    lastRequestCount: number;
    totalSuccesfulRequestCount: number;
    totalFailedRequestCount: number;
    retryCount: number;
    exceptionCount: number;
    throttleCount: number;
    intervalRequestExecutionTime: number;
    lastIntervalRequestExecutionTime: number;
    constructor(endpoint: number, host: string);
}
