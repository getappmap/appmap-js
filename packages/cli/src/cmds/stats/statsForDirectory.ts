import * as fs from 'fs';
import UI from '../userInteraction';
import { Telemetry } from '@appland/telemetry';
import { findFiles, verbose } from '../../utils';
import { Event, buildAppMap } from '@appland/models';
import { AppMapSizeTable, SortedAppMapSize } from './types/appMapSize';
import { FunctionExecutionTime, SlowestExecutionTime } from './types/functionExecutionTime';
import chalk from 'chalk';
import { relative } from 'path';

const MINIMUM_APPMAP_SIZE = (1024 * 1024) / 1;

export function sizeInMB(size: number): number {
  return Number((size / 1000 / 1000).toFixed(1));
}

export async function statsForDirectory(
  appMapDir: string,
  format: string,
  limit: number,
  handlerCaller = 'from_stats'
): Promise<[SortedAppMapSize[], SlowestExecutionTime[]]> {
  async function calculateAppMapSizes(appMapDir: string): Promise<AppMapSizeTable> {
    const appMapSizes: AppMapSizeTable = {};

    // This function is too verbose to be useful in this context.
    const v = verbose();
    verbose(false);
    await findFiles(appMapDir, '.appmap.json', (fileName: string) => {
      const stats = fs.statSync(fileName);
      appMapSizes[fileName] = {
        path: relative(appMapDir, fileName),
        size: stats.size,
      };
    });
    verbose(v);

    return appMapSizes;
  }

  async function sortAppMapSizes(appMapSizes: AppMapSizeTable): Promise<SortedAppMapSize[]> {
    let appMapSizesArray: SortedAppMapSize[] = [];

    for (const key in appMapSizes) {
      appMapSizesArray.push({
        path: appMapSizes[key].path,
        size: appMapSizes[key].size,
      });
    }

    return appMapSizesArray.sort((a, b) => b.size - a.size);
  }

  async function calculateExecutionTimes(
    appMapDir: string
  ): Promise<{ totalTime: number; functions: FunctionExecutionTime[] }> {
    // now that all functions were collected, index them by function
    // name, not by <thread_id,parent_id>
    let totalFunctionExecutionTimes: Record<
      string,
      {
        elapsedInstrumentationTime: number;
        numberOfCalls: number;
        path: string;
      }
    > = {};

    // This function is too verbose to be useful in this context.
    const v = verbose();
    verbose(false);
    // Note that event#elapsed time does NOT include instrumentation overhead.
    // So, instrumentation / elapsed can theoretically be greater than 1.
    let totalTime = 0;
    await findFiles(appMapDir, '.appmap.json', (fileName: string) => {
      const file = fs.readFileSync(fileName, 'utf-8');
      const appmapData = JSON.parse(file.toString());
      const appmap = buildAppMap(appmapData).build();
      appmap.events.forEach((event: Event) => {
        if (event.isCall()) {
          const eventReturn = event.returnEvent;
          if (!eventReturn) return;

          const name = event.codeObject.fqid;
          let elapsedInstrumentationTime = eventReturn.elapsedInstrumentationTime || 0;
          let path = '';

          // some paths are library functions but don't start with /. i.e.:
          // <internal:pack>
          // OpenSSL::Cipher#decrypt
          // Kernel#eval
          if (
            event.definedClass &&
            event.path &&
            (event.path.startsWith('/') ||
              event.path.startsWith('<') ||
              event.path.includes('::') ||
              event.path.startsWith('Kernel'))
          ) {
            // Absolute path names generally signify a library function.
            // Send library function data to help optimize AppMap;
            // don't send user function data.
            path = event.path;
          }

          // Total up the elapsed time of root events.
          if (!event.parent && eventReturn.elapsedTime) {
            totalTime += eventReturn.elapsedTime;
          }

          const existingRecord = totalFunctionExecutionTimes[name];
          if (!existingRecord) {
            totalFunctionExecutionTimes[name] = {
              path,
              numberOfCalls: 1,
              elapsedInstrumentationTime,
            };
          } else {
            existingRecord.numberOfCalls += 1;
            existingRecord.elapsedInstrumentationTime += elapsedInstrumentationTime;
            if (existingRecord.path === '') existingRecord.path = path;
          }
        }
      });
    });
    verbose(v);

    // convert hash to array
    let flatFunctionExecutionTimes: FunctionExecutionTime[] = [];
    for (const name in totalFunctionExecutionTimes) {
      flatFunctionExecutionTimes.push({
        name: name,
        elapsedInstrumentationTime: totalFunctionExecutionTimes[name].elapsedInstrumentationTime,
        numberOfCalls: totalFunctionExecutionTimes[name].numberOfCalls,
        path: totalFunctionExecutionTimes[name].path,
      });
    }

    return { totalTime, functions: flatFunctionExecutionTimes };
  }

  async function sortExecutionTimes(
    functionExecutionTimes: FunctionExecutionTime[]
  ): Promise<FunctionExecutionTime[]> {
    // sort the array
    return functionExecutionTimes.sort(
      (a, b) => b.elapsedInstrumentationTime - a.elapsedInstrumentationTime
    );
  }

  async function showStats(): Promise<[SortedAppMapSize[], SlowestExecutionTime[]]> {
    let biggestAppMapSizes: SortedAppMapSize[] = [];
    // column names in JSON files use snakecase
    let slowestExecutionTimes: SlowestExecutionTime[] = [];
    try {
      UI.status = `Computing AppMap stats...`;
      const appMapSizes: AppMapSizeTable = await calculateAppMapSizes(appMapDir);
      const sortedAppMapSizes: SortedAppMapSize[] = await sortAppMapSizes(appMapSizes);
      UI.success();
      UI.progress('');
      UI.progress(
        chalk.underline(`Largest AppMaps (which are bigger than ${MINIMUM_APPMAP_SIZE / 1024}kb)`)
      );
      sortedAppMapSizes
        .filter((appmap) => appmap.size > MINIMUM_APPMAP_SIZE)
        .slice(0, limit)
        .forEach((appmap) => {
          biggestAppMapSizes.push({
            size: appmap.size,
            path: appmap.path,
          });
        });
      if (format === 'json') {
        console.log(JSON.stringify(biggestAppMapSizes));
      } else {
        biggestAppMapSizes.forEach((appmap) => {
          console.log(sizeInMB(appmap.size) + 'MB ' + appmap.path);
        });
      }

      UI.progress('');
      UI.status = `Computing functions with highest AppMap overhead...`;
      const executionTimes = await calculateExecutionTimes(appMapDir);
      const sortedExecutionTimes = await sortExecutionTimes(executionTimes.functions);
      let totalInstrumentationTime = 0;
      sortedExecutionTimes.forEach(
        (time) => (totalInstrumentationTime += time.elapsedInstrumentationTime)
      );

      UI.success();
      UI.progress('');

      // if there are no instrumentation data don't show this report
      if (
        sortedExecutionTimes.length > 0 &&
        sortedExecutionTimes[0].elapsedInstrumentationTime === 0
      ) {
        console.log(
          "These AppMaps don't contain function overhead data. Please update your appmap package to the latest version."
        );
      } else {
        sortedExecutionTimes.slice(0, limit).forEach((executionTime) => {
          slowestExecutionTimes.push({
            elapsed_instrumentation_time_total: Number(
              executionTime.elapsedInstrumentationTime.toFixed(6)
            ),
            num_calls: executionTime.numberOfCalls,
            name: executionTime.name,
            path: executionTime.path,
          });
        });

        if (format === 'json') {
          console.log(JSON.stringify(slowestExecutionTimes));
        } else {
          UI.progress(chalk.underline(`Total instrumentation time`));
          console.log(`${Math.round(totalInstrumentationTime * 1000)}ms`);
          UI.progress('');
          UI.progress(chalk.underline(`Functions with highest AppMap overhead`));

          console.log(
            chalk.underline(
              [
                'Time'.padStart(9),
                '%'.padStart(5),
                'Count'.padStart(7),
                'Function name'.padEnd(30),
              ].join(' | ')
            )
          );
          slowestExecutionTimes.forEach((executionTime) => {
            const displayMs = [
              Math.round(executionTime.elapsed_instrumentation_time_total * 1000).toString(),
              'ms',
            ].join('');
            const displayPercent = `${(
              Math.round(
                (executionTime.elapsed_instrumentation_time_total / totalInstrumentationTime) * 1000
              ) / 10
            ).toLocaleString('en-us', { maximumFractionDigits: 2, minimumFractionDigits: 0 })}%`;

            console.log(
              [
                displayMs.padStart(9),
                displayPercent.padStart(5),
                executionTime.num_calls.toString().padStart(7),
                executionTime.name.split(':').slice(1).join(':'),
              ].join(' | ')
            );
          });
        }
      }

      let telemetryMetrics = {};
      let telemetryMetricsCounter = 1;
      biggestAppMapSizes.forEach((appmap) => {
        telemetryMetrics[`biggestAppmaps_${telemetryMetricsCounter}`] = appmap.size;
        telemetryMetricsCounter += 1;
      });
      telemetryMetricsCounter = 1;
      slowestExecutionTimes.forEach((executionTime) => {
        telemetryMetrics[`slowestInstrumentationTimesTotal_${telemetryMetricsCounter}`] =
          executionTime.elapsed_instrumentation_time_total;
        telemetryMetrics[`slowestInstrumentationTimesPath_${telemetryMetricsCounter}`] =
          executionTime.path;
        telemetryMetricsCounter += 1;
      });
    } catch (err) {
      let errorMessage: string | undefined = (err as any).toString();
      if (err instanceof Error) {
        Telemetry.sendEvent({
          name: `stats:${handlerCaller}:error`,
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
}
