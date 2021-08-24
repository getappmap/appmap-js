// @ts-check

const { join: joinPath } = require('path');
const { promises: fsp } = require('fs');
const { verbose, listAppMapFiles, baseName } = require('../utils');

// http://127.0.0.1:9516/session/69857e75c343c04e3dd841fb656156c9/element/87f74064-ff83-44b0-ac20-05cce2951c71
const SeleniumClientRegexp = /http:\/\/127.0.0.1:\d+\/session\/[a-f0-9]+\//;

class BuildInventory {
  constructor(directory) {
    this.directory = directory;
    this.print = true;
  }

  /**
   *
   * @returns {Promise<import('./types').Inventory>}
   */
  async execute() {
    if (verbose()) {
      console.warn(`Collecting inventory info from ${this.directory}`);
    }

    const result = /** import('./types').Inventory */ {
      packages: new Set(),
      classes: new Set(),
      labels: new Set(),
      packageDependencies: new Set(),
      sqlTables: new Set(),
      sqlNormalized: new Set(),
      httpServerRequests: new Set(),
      httpClientRequests: new Set(),
    };
    const callStacks = new Set();
    // const timingMeasurements = {};

    await this.files(async (appMapFileName) => {
      if (verbose()) {
        console.warn(`Collecting inventory info from ${appMapFileName}`);
      }
      const indexDir = baseName(appMapFileName);

      await Promise.all(
        Object.keys(result).map(async (algorithmName) => {
          const itemsData = await fsp.readFile(
            joinPath(indexDir, `canonical.${algorithmName}.json`)
          );
          const items = JSON.parse(itemsData.toString());

          items.forEach((item) => {
            if (item.route && SeleniumClientRegexp.test(item.route)) {
              return;
            }
            result[algorithmName].add(JSON.stringify(item));
          });
        })
      );

      const traceData = await fsp.readFile(
        joinPath(indexDir, `canonical.trace.json`)
      );
      const trace = JSON.parse(traceData.toString());
      const stack = [];

      const stringifyFunction = (call) =>
        call.labels.length > 0 ? call.labels.sort().join(',') : null;
      const stringifyHttpServerRequest = (call) =>
        `${call.route} ${call.status_code}`;
      const stringifyHttpClientRequest = (call) => {
        if (SeleniumClientRegexp.test(call.route)) {
          return null;
        }
        return `${call.route} ${call.status_code}`;
      };
      const stringifySql = (call) => call.sql.normalized_query;
      const stringifyDefault = (call) => JSON.stringify(call);

      const stringifiers = {
        function: stringifyFunction,
        http_server_request: stringifyHttpServerRequest,
        http_client_request: stringifyHttpClientRequest,
        sql: stringifySql,
      };

      const buildStack = (call) => {
        const stringifier = stringifiers[call.kind] || stringifyDefault;
        const callStr = stringifier(call);
        stack.push(callStr);
        if (call.children && call.children.length > 0) {
          call.children.forEach(buildStack);
        } else {
          const stackStr = stack.filter((e) => e);
          if (verbose()) {
            console.log(`Collecting ${JSON.stringify(stackStr)}`);
          }
          // Save the AppMap name/path here, as well as the event id of the leaf.
          callStacks.add(JSON.stringify(stackStr));
        }
        stack.pop();
      };

      trace
        .filter((call) => call.route || (call.labels && call.labels.length > 0))
        .forEach(buildStack);
      result.stacks = callStacks;

      /*
      const timingData = await fsp.readFile(
        joinPath(indexDir, `canonical.timing.json`)
      );
      const timing = JSON.parse(timingData.toString());
      Object.keys(timing).forEach((kind) => {
        if (!timingMeasurements[kind]) {
          timingMeasurements[kind] = {};
        }
        Object.keys(timing[kind]).forEach((id) => {
          if (!timingMeasurements[kind][id]) {
            timingMeasurements[kind][id] = [];
          }
          timing[kind][id].forEach((measurement) => {
            timingMeasurements[kind][id].push(measurement);
          });
        });
      });
      */
    });

    /*
    const timingStats = {};
    Object.keys(timingMeasurements).forEach((kind) => {
      timingStats[kind] = {};
      Object.keys(timingMeasurements[kind]).forEach((id) => {
        const measurements = timingMeasurements[kind][id];
        const sum = measurements.reduce((memo, timing) => memo + timing, 0);
        timingStats[kind][id] = {};
        timingStats[kind][id].count = measurements.length;
        timingStats[kind][id].sum = sum;
        timingStats[kind][id].mean = sum / measurements.length;
      });
    });
    result.timing = timingStats;
    */

    // @ts-ignore
    return Object.keys(result).reduce((memo, key) => {
      memo[key] = [...result[key]].sort();
      return memo;
    }, {});
  }

  async files(fn) {
    return listAppMapFiles(this.directory, fn);
  }
}

module.exports = BuildInventory;
