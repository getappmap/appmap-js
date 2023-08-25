"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkStatsbeat = void 0;
var NetworkStatsbeat = /** @class */ (function () {
    function NetworkStatsbeat(endpoint, host) {
        this.endpoint = endpoint;
        this.host = host;
        this.totalRequestCount = 0;
        this.totalSuccesfulRequestCount = 0;
        this.totalFailedRequestCount = 0;
        this.retryCount = 0;
        this.exceptionCount = 0;
        this.throttleCount = 0;
        this.intervalRequestExecutionTime = 0;
        this.lastIntervalRequestExecutionTime = 0;
        this.lastTime = +new Date;
        this.lastRequestCount = 0;
    }
    return NetworkStatsbeat;
}());
exports.NetworkStatsbeat = NetworkStatsbeat;
//# sourceMappingURL=NetworkStatsbeat.js.map