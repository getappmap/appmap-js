import { CodeObject } from '@appland/models';
import { createInterface } from 'readline';
import {
  BreakOnCodeObject,
  BreakOnCounter,
  BreakOnEvent,
  BreakOnLabel,
  Breakpoint,
} from '../../breakpoint';
import ScanContext from '../scanContext';
import { State } from '../state';
import UI from '../userInteraction';
import scan from './scan';

const history: string[] = [];

export default async function addBreakpoint(context: ScanContext): Promise<State> {
  const onCounter = async (): Promise<Breakpoint | undefined> => {
    const { sequenceNumber } = await UI.prompt({
      name: 'sequenceNumber',
      type: 'number',
      message: 'Sequence number:',
    });

    return new BreakOnCounter(Number(sequenceNumber));
  };

  const onEventName = async (): Promise<Breakpoint | undefined> => {
    const { eventName } = await UI.prompt({
      name: 'eventName',
      type: 'input',
      message: 'Event name:',
    });

    return new BreakOnEvent(eventName);
  };

  const onLabel = async (): Promise<Breakpoint | undefined> => {
    const { labelName } = await UI.prompt({
      name: 'labelName',
      type: 'input',
      message: 'Event label:',
    });

    return new BreakOnLabel(labelName);
  };

  const onCodeObject = async (): Promise<Breakpoint | undefined> => {
    let codeObjectName: string;
    if (!context.progress.appMap) {
      codeObjectName = (
        await UI.prompt({
          name: 'codeObjectName',
          type: 'input',
          message: 'Code object:',
        })
      )['codeObjectName'];
    } else {
      let codeObjectIds: string[] = [];
      const collectCodeObjectNames = (codeObject: CodeObject): void => {
        codeObjectIds.push(codeObject.fqid);
      };
      context.progress.appMap.classMap.visit(collectCodeObjectNames);
      codeObjectIds = codeObjectIds.sort();

      const codeObjectCompleter = (line: string): [string[], string] => {
        let options = codeObjectIds.filter((id) => id.startsWith(line));
        if (options.length === 0)
          options = codeObjectIds
            .filter((id) => id.includes(line))
            .map((id) => id.slice(id.indexOf(line)));

        return [options, line];
      };

      codeObjectName = await new Promise<string>((resolve, _reject) => {
        const rl = createInterface({
          input: process.stdin,
          output: process.stdout,
          completer: codeObjectCompleter,
          history,
          historySize: 1000,
          removeHistoryDuplicates: true,
          prompt: 'Code object: ',
          tabSize: 4,
        });
        let response = '';
        rl.on('line', (data) => {
          response = data;
          rl.close();
        });
        rl.on('close', () => {
          resolve(response);
        });
        rl.prompt();
      });
    }

    if (codeObjectName && codeObjectName !== '') return new BreakOnCodeObject(codeObjectName);
  };

  const choices: Record<string, (() => Promise<Breakpoint | undefined>) | null> = {
    'break at sequence number': onCounter,
    'break on label': onLabel,
    'break on code object': onCodeObject,
    'break on event name': onEventName,
    quit: null,
  };

  UI.progress(`Choose a breakpoint type, and enter the criteria.`);
  UI.progress(`NOTE: label, code object, and event name breakpoints can be regular expressions.`);
  UI.progress(`      To enter a regular expression, use the syntax: /expr/`);
  const { action: actionName } = await UI.prompt({
    name: 'action',
    type: 'list',
    message: 'How would you like to proceed?:',
    choices: Object.keys(choices),
  });
  const action = choices[actionName];

  if (!action) return scan;

  const breakpoint = await action();
  if (breakpoint) context.progress.addBreakpoint(breakpoint);

  return scan;
}
