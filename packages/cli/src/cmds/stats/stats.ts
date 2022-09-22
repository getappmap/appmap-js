import yargs from 'yargs';
import { chdir } from 'process';
const fs = require('fs');
import UI from '../userInteraction';
import Telemetry from '../../telemetry';
import { listAppMapFiles, verbose } from '../../utils';
import { Event, buildAppMap } from '@appland/models';

import {
  AppMapSize,
  AppMapSizeTable,
  SortedAppMapSize,
} from './types/appMapSize';
import {
  FunctionExecutionTime,
  SlowestExecutionTime,
} from './types/functionExecutionTime';
import { relative } from 'path';

export const command = 'stats [directory]';
export const describe =
  'Show some statistics about events in scenarios read from AppMap files';
const LIMIT_DEFAULT = 10;
const MINIMUM_APPMAP_SIZE = (1024 * 1024) / 1;

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'Working directory for the command.',
    type: 'string',
    alias: 'd',
  });

  args.option('json', {
    describe: 'Format results as JSON.',
    type: 'boolean',
    alias: 'j',
  });

  args.option('limit', {
    describe:
      'limit the number of methods displayed (default ' + LIMIT_DEFAULT + ').',
    type: 'number',
    alias: 'l',
    default: LIMIT_DEFAULT,
  });

  return args.strict();
};

export async function handler(argv: any) {
  verbose(argv.verbose);

  const commandFn = async () => {
    const { directory, json, limit: limitToUse } = argv;
    if (directory) {
      if (verbose()) console.log(`Using working directory ${directory}`);
      chdir(directory);
    }

    let directoryToUse = directory;
    if (!directoryToUse) directoryToUse = '.';

    async function calculateAppMapSizes(
      appMapDir: string
    ): Promise<AppMapSizeTable> {
      const appMapSizes: AppMapSizeTable = {};

      // This function is too verbose to be useful in this context.
      const v = verbose();
      verbose(false);
      await listAppMapFiles(appMapDir, (fileName: string) => {
        const stats = fs.statSync(fileName);
        appMapSizes[fileName] = {
          path: relative(appMapDir, fileName),
          size: stats.size,
        };
      });
      verbose(v);

      return appMapSizes;
    }

    async function sortAppMapSizes(
      appMapSizes: AppMapSizeTable
    ): Promise<SortedAppMapSize[]> {
      let appMapSizesArray: SortedAppMapSize[] = [];

      for (const key in appMapSizes) {
        appMapSizesArray.push({
          path: appMapSizes[key].path,
          size: appMapSizes[key].size,
        });
      }

      return appMapSizesArray.sort((a, b) => b.size - a.size);
    }

    function sizeInMB(size: number): number {
      return Number((size / 1000 / 1000).toFixed(1));
    }

    async function calculateExecutionTimes(appMapDir: string) {
      let functionExecutionTimes = {};

      // This function is too verbose to be useful in this context.
      const v = verbose();
      verbose(false);
      await listAppMapFiles(appMapDir, (fileName: string) => {
        const file = fs.readFileSync(fileName, 'utf-8');
        const appmapData = JSON.parse(file.toString());
        const appmap = buildAppMap(appmapData).build();
        functionExecutionTimes[fileName] = {
          functions: {},
        };
        appmap.events.forEach((event: Event) => {
          if (event.isCall()) {
            const functionKey = 'thread_' + event.threadId + '_id_' + event.id;
            if (!(functionKey in functionExecutionTimes[fileName].functions)) {
              let newData = {
                name: event.codeObject.fqid,
                elapsedInstrumentationTimeTotal: 0,
                callNoReturnFound: true,
                numberOfCalls: 0,
                path: '',
              };
              // some paths are library functions but don't start with /. i.e.:
              // <internal:pack>
              // OpenSSL::Cipher#decrypt
              // Kernel#eval
              if (
                event.definedClass &&
                event.path &&
                (event.path[0] == '/' ||
                  event.path[0] == '<' ||
                  event.path.includes('::') ||
                  event.path.startsWith('Kernel'))
              ) {
                // Absolute path names generally signify a library function.
                // Send library function data to help optimize AppMap;
                // don't send user function data.
                newData.path = event.path;
              }
              functionExecutionTimes[fileName].functions[functionKey] = newData;
            } else {
              functionExecutionTimes[fileName].functions[
                functionKey
              ].callNoReturnFound = true;
            }
          } else {
            // It's a return.  A return's parent_id matches the call's id
            const functionKey =
              'thread_' + event.threadId + '_id_' + event.parentId;
            if (
              functionKey in functionExecutionTimes[fileName].functions &&
              functionExecutionTimes[fileName].functions[functionKey]
                .callNoReturnFound
            ) {
              functionExecutionTimes[fileName].functions[
                functionKey
              ].callNoReturnFound = false;
              if (event.elapsedInstrumentationTime) {
                functionExecutionTimes[fileName].functions[
                  functionKey
                ].elapsedInstrumentationTimeTotal +=
                  event.elapsedInstrumentationTime;
              }
              functionExecutionTimes[fileName].functions[
                functionKey
              ].numberOfCalls += 1;
            } // else something went wrong: found return with no call
          }
        });
      });
      verbose(v);

      // now that all functions were collected, index them by function
      // name, not by <thread_id,parent_id>
      let totalFunctionExecutionTimes = {};
      for (const fileName in functionExecutionTimes) {
        for (const functionKey in functionExecutionTimes[fileName].functions) {
          const name =
            functionExecutionTimes[fileName].functions[functionKey].name;
          if (!(name in totalFunctionExecutionTimes)) {
            totalFunctionExecutionTimes[name] = {
              elapsedInstrumentationTimeTotal: 0,
              numberOfCalls: 0,
              path: functionExecutionTimes[fileName].functions[functionKey]
                .path,
            };
          }
          totalFunctionExecutionTimes[name].elapsedInstrumentationTimeTotal +=
            functionExecutionTimes[fileName].functions[
              functionKey
            ].elapsedInstrumentationTimeTotal;
          totalFunctionExecutionTimes[name].numberOfCalls += 1;
        }
      }

      // convert hash to array
      let flatFunctionExecutionTimes: FunctionExecutionTime[] = [];
      for (const name in totalFunctionExecutionTimes) {
        flatFunctionExecutionTimes.push({
          name: name,
          elapsedInstrumentationTimeTotal:
            totalFunctionExecutionTimes[name].elapsedInstrumentationTimeTotal,
          numberOfCalls: totalFunctionExecutionTimes[name].numberOfCalls,
          path: totalFunctionExecutionTimes[name].path,
        });
      }

      return flatFunctionExecutionTimes;
    }

    async function sortExecutionTimes(
      functionExecutionTimes: FunctionExecutionTime[]
    ): Promise<FunctionExecutionTime[]> {
      // sort the array
      return functionExecutionTimes.sort(
        (a, b) =>
          b.elapsedInstrumentationTimeTotal - a.elapsedInstrumentationTimeTotal
      );
    }

    async function showStats(): Promise<
      [SortedAppMapSize[], SlowestExecutionTime[]]
    > {
      let biggestAppMapSizes: SortedAppMapSize[] = [];
      // column names in JSON files use snakecase
      let slowestExecutionTimes: SlowestExecutionTime[] = [];
      try {
        UI.status = `Computing AppMap stats...`;
        const appMapDir = directoryToUse;
        const appMapSizes: AppMapSizeTable = await calculateAppMapSizes(
          appMapDir
        );
        const sortedAppMapSizes: SortedAppMapSize[] = await sortAppMapSizes(
          appMapSizes
        );

        UI.status = `Displaying biggest appmaps...\n`;
        sortedAppMapSizes
          .filter((appmap) => appmap.size > MINIMUM_APPMAP_SIZE)
          .slice(0, limitToUse)
          .forEach((appmap) => {
            biggestAppMapSizes.push({
              size: appmap.size,
              path: appmap.path,
            });
          });
        if (json) {
          console.log(JSON.stringify(biggestAppMapSizes));
        } else {
          biggestAppMapSizes.forEach((appmap) => {
            console.log(sizeInMB(appmap.size) + 'MB ' + appmap.path);
          });
        }

        UI.status = `Computing functions with highest AppMap overhead...\n`;
        const executionTimes = await calculateExecutionTimes(appMapDir);
        const sortedExecutionTimes = await sortExecutionTimes(executionTimes);
        UI.success();
        UI.status = `Displaying functions with highest AppMap overhead...\n`;

        // if there are no instrumentation data don't show this report
        if (
          sortedExecutionTimes.length > 0 &&
          sortedExecutionTimes[0].elapsedInstrumentationTimeTotal == 0
        ) {
          console.log('No "elapsed_instrumentation" data in the AppMaps.');
        } else {
          sortedExecutionTimes.slice(0, limitToUse).forEach((executionTime) => {
            slowestExecutionTimes.push({
              elapsed_instrumentation_time_total: Number(
                executionTime.elapsedInstrumentationTimeTotal.toFixed(6)
              ),
              num_calls: executionTime.numberOfCalls,
              name: executionTime.name,
              path: executionTime.path,
            });
          });
          if (json) {
            console.log(JSON.stringify(slowestExecutionTimes));
          } else {
            slowestExecutionTimes.forEach((executionTime) => {
              console.log(
                String(executionTime.elapsed_instrumentation_time_total).padEnd(
                  10,
                  '0'
                ) +
                  's ' +
                  executionTime.name +
                  ' ' +
                  executionTime.num_calls +
                  ' calls'
              );
            });
          }
        }

        let telemetryMetrics = {};
        let telemetryMetricsCounter = 1;
        biggestAppMapSizes.forEach((appmap) => {
          telemetryMetrics[`biggestAppmaps_${telemetryMetricsCounter}`] =
            appmap.size;
          telemetryMetricsCounter += 1;
        });
        telemetryMetricsCounter = 1;
        slowestExecutionTimes.forEach((executionTime) => {
          telemetryMetrics[
            `slowestInstrumentationTimesTotal_${telemetryMetricsCounter}`
          ] = executionTime.elapsed_instrumentation_time_total;
          telemetryMetrics[
            `slowestInstrumentationTimesPath_${telemetryMetricsCounter}`
          ] = executionTime.path;
          telemetryMetricsCounter += 1;
        });

        Telemetry.sendEvent({
          name: 'stats:success',
          properties: {
            path: appMapDir,
          },
          metrics: telemetryMetrics,
        });
      } catch (err) {
        let errorMessage: string | undefined = (err as any).toString();
        if (err instanceof Error) {
          Telemetry.sendEvent({
            name: 'stats:error',
            properties: {
              errorMessage,
              errorStack: err.stack,
            },
          });
        }
      }

      return [biggestAppMapSizes, slowestExecutionTimes];
    }

    return await showStats();
  };

  return await commandFn();
}

export default {
  command: command,
  describe: describe,
  builder: builder,
  handler: handler,
};
