import { buildAppMap, Event as AppMapEvent } from '@appland/models';
import cliProgress from 'cli-progress';
import assert from 'assert';
import { readFile, writeFile } from 'fs/promises';
import { basename } from 'path';
import yargs from 'yargs';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { locateAppMapDir } from '../../lib/locateAppMapDir';
import FindCodeObjects from '../../search/findCodeObjects';
import FindEvents from '../../search/findEvents';
import { verbose } from '../../utils';
import { ValidationError } from '../errors';

export const command = 'trace-data [data-item]';
export const describe = 'Trace data ancestry';

type SearchItem = {
  codeObjectPattern: string;
  param: string;
};

function parseSearchItem(dataItem: string): SearchItem {
  const tokens = dataItem.match(/(.*)\((.*)\)/);
  if (!tokens || !tokens[1] || !tokens[2])
    throw new ValidationError(`Unable to parse data-item ${dataItem}`);

  return {
    codeObjectPattern: tokens[1],
    param: tokens[2],
  };
}

export const builder = (args: yargs.Argv) => {
  args.positional('data-item', {
    describe: 'identifies a data item to trace',
    required: true,
  });

  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });
  args.option('appmap-dir', {
    describe: 'directory to recursively inspect for AppMaps',
  });
  args.option('appmap-file', {
    describe: 'AppMap file to inspect',
  });

  return args.strict();
};

export const handler = async (argv: any) => {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);

  console.log(`Searching AppMaps for ${argv.dataItem}`);

  const searchItem = parseSearchItem(argv.dataItem);

  let findCodeObjects: FindCodeObjects;
  if (argv.appmapFile) {
    console.warn(`Searching AppMap ${argv.appmapFile}`);
    findCodeObjects = new FindCodeObjects(
      searchItem.codeObjectPattern,
      undefined,
      [argv.appmapFile]
    );
  } else {
    const appmapDir = await locateAppMapDir(argv.appmapDir);
    console.warn(`Finding matching AppMaps in ${appmapDir}`);
    findCodeObjects = new FindCodeObjects(
      searchItem.codeObjectPattern,
      appmapDir
    );
  }

  let progress = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic
  );
  const codeObjectMatches = await findCodeObjects.find(
    (count) => progress.start(count, 0),
    progress.increment.bind(progress)
  );
  progress.stop();

  console.warn(
    `Found ${codeObjectMatches.length} AppMaps containing ${searchItem.codeObjectPattern}`
  );

  const appmaps = new Set<string>();
  for (let index = 0; index < codeObjectMatches.length; index++) {
    const codeObjectMatch = codeObjectMatches[index];
    if (appmaps.has(codeObjectMatch.appmap)) continue;

    appmaps.add(codeObjectMatch.appmap);

    const eventsByData = new Map<string, Set<AppMapEvent>>();
    const appmap = buildAppMap(
      await readFile([codeObjectMatch.appmap, 'appmap.json'].join('.'), 'utf-8')
    ).build();

    {
      const collectParameters = (
        event: AppMapEvent,
        values: Set<string>
      ): void => {
        if (!event.parameters) return;

        event.parameters.map((m) => values.add(m.value));
      };

      const collectMessage = (
        event: AppMapEvent,
        values: Set<string>
      ): void => {
        if (!event.message) return;

        event.message.map((m) => values.add(m.value));
      };

      const collectReceiver = (event: AppMapEvent, values: Set<string>): void => {
        if (!event.receiver) return;

        values.add(event.receiver.value);
      };

      const collectReturnValue = (
        event: AppMapEvent,
        values: Set<string>
      ): void => {
        if (!event.returnValue) return;

        values.add(event.returnValue.value);
      };

      const collectEventData = (event: AppMapEvent): Set<string> => {
        const result = new Set<string>();
        collectParameters(event, result);
        collectMessage(event, result);
        collectReceiver(event, result);
        collectReturnValue(event, result);
        return result;
      };

      appmap.events.forEach((event) => {
        const eventData = collectEventData(event);
        eventData.delete('');
        for (const value of eventData) {
          if (!eventsByData.get(value))
            eventsByData.set(value, new Set<AppMapEvent>());

          eventsByData.get(value)!.add(event);
        }
      });
    }

    const findEvents = new FindEvents(
      codeObjectMatch.appmap,
      codeObjectMatch.codeObject
    );
    findEvents.filter([{ name: 'hasParameter', value: searchItem.param }]);
    const eventMatches = await findEvents.matches();
    console.warn(
      `Matches ${eventMatches.length} events in ${codeObjectMatch.appmap}`
    );

    const valuesOfInterest = new Set<string>();
    const collectParameterValueOfEventMatch = (event?: AppMapEvent) => {
      if (!event) return;
      if (!event.parameters) return;

      const param = event.parameters.find((p) => p.name === searchItem.param);
      assert(param, `No ${searchItem.param} found on event ${event}`);
      const value = param.value;
      if (!value || value === '') return;

      valuesOfInterest.add(value);
    };

    // For each event match, collect the value of the target parameter
    eventMatches.forEach((match) =>
      collectParameterValueOfEventMatch(
        appmap.events.find((e) => e.id === match.event.id)
      )
    );

    // Find all events whose return value is a value of interest.
    // Add parameter values for that event to the values of interest.
    // Terminate when no values of interest are found.
    const collectParameterValuesOfValueReturningEvent = (
      event: AppMapEvent
    ) => {
      if (!event.returnValue) return;
      if (!valuesOfInterest.has(event.returnValue.value)) return;

      if (event.parameters)
        event.parameters
          .filter((param) => param.value && param.value !== '')
          .forEach((param) => valuesOfInterest.add(param.value));
      if (event.receiver?.value && event.receiver.value !== '')
        valuesOfInterest.add(event.receiver.value);
    };

    // Collect parameter values that lead to values of interest
    let valuesOfInterestCount: number;
    do {
      valuesOfInterestCount = valuesOfInterest.size;
      for (let index = 0; index < appmap.events.length; index++) {
        const event = appmap.events[index];
        collectParameterValuesOfValueReturningEvent(event);
      }
    } while (valuesOfInterest.size > valuesOfInterestCount);

    // Collect all events which are related to a value of interest.
    const eventIds = new Set<number>();
    for (const value of valuesOfInterest) {
      const events = eventsByData.get(value);
      if (!events)
        assert(events, `No events found for parameter value ${value}`);

      for (const event of events) {
        eventIds.add(event.id);
      }
    }

    const ancestorEvents = appmap.events.filter(
      (event) => eventIds.has(event.id) || eventIds.has(event.linkedEvent.id)
    );

    await writeFile(
      [basename(codeObjectMatch.appmap), 'data_trace.appmap.json'].join('_'),
      JSON.stringify({
        metadata: appmap.metadata,
        classMap: appmap.classMap,
        events: ancestorEvents,
      })
    );
  }
};
