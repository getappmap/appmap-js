// @ts-check

const { join: joinPath } = require('path');
const { promises: fsp } = require('fs');
const { verbose, listAppMapFiles, baseName } = require('../utils');
const { SeleniumClientRegexp } = require('./util');

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

    const result = /** {import('./types').Inventory} */ {
      packages: new Set(),
      classes: new Set(),
      labels: new Set(),
      packageDependencies: new Set(),
      sqlTables: new Set(),
      sqlNormalized: new Set(),
      httpServerRequests: new Set(),
      httpClientRequests: new Set(),
    };
    const appMaps = [];
    const callStacks = new Set();
    const functionTrigrams = new Set();
    // const timingMeasurements = {};

    await this.files(async (appMapFileName) => {
      if (verbose()) {
        console.warn(`Collecting inventory info from ${appMapFileName}`);
      }
      const indexDir = baseName(appMapFileName);

      const metadataStr = await fsp.readFile(
        joinPath(indexDir, `metadata.json`)
      );
      const metadata = JSON.parse(metadataStr.toString());
      appMaps.push(
        JSON.stringify({
          fileName: appMapFileName,
          name: metadata.name,
          infoFingerprint: metadata.fingerprints.find(
            (fp) => fp.canonicalization_algorithm === 'info'
          ).digest,
        })
      );

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

      const objectifyLabels = (call) =>
        call.labels.length > 0 ? { labels: call.labels.sort() } : null;
      const objectifyHttpServerRequest = (call) => ({
        route: call.route,
        parameters: call.parameter_names,
        status: call.status_code,
      });
      const objectifyHttpClientRequest = (call) => {
        if (SeleniumClientRegexp.test(call.route)) {
          return null;
        }
        return {
          route: call.route,
          parameters: call.parameter_names,
          status: call.status_code,
        };
      };
      const objectifyQuery = (call) => ({
        query: call.sql.normalized_query,
      });
      const objectifyFunction = (call) => ({ function: call.function });
      const objectifyDefault = (call) => call;

      const functionTrigramObjectifiers = {
        function: objectifyFunction,
        http_server_request: objectifyHttpServerRequest,
        http_client_request: objectifyHttpClientRequest,
        sql: objectifyQuery,
      };
      const stackObjectifiers = {
        function: objectifyLabels,
        http_server_request: objectifyHttpServerRequest,
        http_client_request: objectifyHttpClientRequest,
        sql: objectifyQuery,
      };

      function functionTrigramObjectify(call) {
        return (functionTrigramObjectifiers[call.kind] || objectifyDefault)(
          call
        );
      }
      function stackObjectify(call) {
        return (stackObjectifiers[call.kind] || objectifyDefault)(call);
      }

      const buildStack = (call) => {
        stack.push(call);
        if (call.children && call.children.length > 0) {
          call.children.forEach(buildStack);
        } else {
          const stackStr = stack.map(stackObjectify).filter((e) => e);
          if (verbose()) {
            console.log(`Collecting ${JSON.stringify(stackStr)}`);
          }
          // Save the AppMap name/path here, as well as the event id of the leaf.
          callStacks.add(JSON.stringify(stackStr));

          // eslint-disable-next-line no-lonely-if
          if (stack.length > 2) {
            const trigram = stack.slice(stack.length - 3, stack.length);
            functionTrigrams.add(
              JSON.stringify(trigram.map(functionTrigramObjectify))
            );
          }
        }
        stack.pop();
      };

      trace
        .filter((call) => call.route || (call.labels && call.labels.length > 0))
        .forEach(buildStack);

      result.appMaps = appMaps;
      result.functionTrigrams = functionTrigrams;
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
