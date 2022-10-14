import { forEach } from 'async';
import {
  Action,
  Diagram,
  isConditional,
  isLoop,
  isRequest,
  isWebRequest,
  Request,
  Response,
} from '../types';

const DisplayCharLimit = 50;

export const extension = '.uml';

function encode(str: string): string {
  return str.replace(/\n/g, '\\n').replace(/\s{2,}/g, ' ');
}

function alias(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}

function fold(line: string, limit: number): string {
  const output: string[] = [];
  let buffer = '';
  line
    .split('\n')
    .map((line) => line.split(/\s+/))
    .flat()
    .forEach((word) => {
      if (buffer.length === 0) {
        buffer += word;
      } else if (buffer.length + word.length < limit) {
        buffer += ' ';
        buffer += word;
      } else {
        output.push(buffer);
        buffer = word;
      }
    });
  return output.join('\n');
}

class EventLines {
  _indent = 1;

  public lines: string[] = [];

  constructor() {}

  indent(): void {
    this._indent += 1;
  }
  outdent(): void {
    this._indent -= 1;
  }

  printLeftAligned(...lines: string[]): void {
    lines.forEach((line) => this.lines.push(line));
  }

  print(...lines: string[]): void {
    lines.forEach((line) => this.lines.push([Array(this._indent).join('  '), line].join('')));
  }
}

export function format(diagram: Diagram, source: string): string {
  const requestArrow = (_message: Request): string => '->';
  const responseArrow = (_message: Response): string => '-->';

  const events = new EventLines();

  const renderChildren = (action: Action) =>
    action.children.forEach((child) => renderAction(child));

  const renderAction = (action: Action): void => {
    events.indent();

    if (isRequest(action)) {
      events.print(
        [
          [alias(action.caller.name), alias(action.callee.name)].join(requestArrow(action)),
          encode(action.name.slice(0, DisplayCharLimit)),
        ].join(': ')
      );
      if (action.name.length > DisplayCharLimit) {
        events.print('Note right');
        events.indent();
        events.printLeftAligned(fold(action.name, 80));
        events.outdent();
        events.print('End note');
      }

      if (action.children.length > 0) {
        events.print(`activate ${alias(action.callee.name)}`);
        renderChildren(action);
      }

      if (action.response) {
        events.print(
          [
            [alias(action.callee.name), alias(action.caller.name)].join(
              responseArrow(action.response)
            ),
            encode(action.response.returnValueType?.name || 'unknown type'),
          ].join(': ')
        );
      }

      if (action.children.length > 0) {
        events.print(`deactivate ${alias(action.callee.name)}`);
      }
    } else if (isWebRequest(action)) {
      events.print(
        `[-> ${alias(action.callee.name)}: ${action.route}`,
        `activate ${alias(action.callee.name)}`
      );

      renderChildren(action);

      events.print(
        `[<- ${alias(action.callee.name)}: ${action.status}`,
        `deactivate ${alias(action.callee.name)}`
      );
    } else if (isLoop(action)) {
      events.print(`Loop ${action.count} times`);

      renderChildren(action);

      events.print(`End`);
    } else if (isConditional(action)) {
      events.print(
        `${action.nodeName} ${action.conditionName === 'delete' ? '#ffaaaa' : ''} ${
          action.conditionName
        }`
      );

      renderChildren(action);

      if (action.parent) {
        const childIndex = action.parent.children.indexOf(action);
        if (childIndex === action.parent.children.length - 1) events.print('end');
      } else {
        events.print('end');
      }
    }

    events.outdent();
  };

  diagram.rootActions.forEach((action) => renderAction(action));

  return `@startuml
${diagram.actors
  .map((actor) => `participant ${alias(actor.name)} as "${encode(actor.name)}"`)
  .join('\n')}
${events.lines.join('\n')}
@enduml`;
}
