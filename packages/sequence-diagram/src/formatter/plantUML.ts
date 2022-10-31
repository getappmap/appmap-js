import assert from 'assert';
import {
  Action,
  Diagram,
  DiffMode,
  hasAncestor,
  isLoop,
  isFunction,
  isServerRPC,
  FunctionCall,
  ReturnValue,
  actionActors,
  ServerRPC,
  ClientRPC,
  Query,
  isClientRPC,
} from '../types';

const DisplayCharLimit = 50;

export const extension = '.uml';

function sanitize(str: string): string {
  return str.replace(/\n/g, '\\n').replace(/\s{2,}/g, ' ');
}

function messageName(action: FunctionCall | ServerRPC | ClientRPC | Query): string {
  return isFunction(action)
    ? action.name
    : isServerRPC(action) || isClientRPC(action)
    ? action.route
    : action.query;
}

function messageDisplayName(action: FunctionCall | ServerRPC | ClientRPC | Query): string {
  const name = messageName(action);
  const tokens = [name.slice(0, DisplayCharLimit)];
  if (isFunction(action) && action.static) {
    tokens.unshift('<u>');
    tokens.push('</u>');
  }
  return tokens.join('');
}

type Response = ReturnValue & {
  status?: number;
};

function actionResponse(
  action: FunctionCall | ServerRPC | ClientRPC | Query
): Response | undefined {
  return isFunction(action)
    ? action.returnValue
    : isServerRPC(action) || isClientRPC(action)
    ? { status: action.status, raisesException: action.status >= 400 }
    : undefined;
}

function encode(action: Action, str: string): string {
  let text = sanitize(str);
  if (action.diffMode !== undefined) {
    text = ['<b>', `<color:${color(action)}>`, text, '</color>', '</b>'].join('');
  }
  return text;
}

function alias(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}

function color(action: Action): string | undefined {
  switch (action.diffMode) {
    case DiffMode.Delete:
      return 'red';
    case DiffMode.Insert:
      return 'green';
  }
}

function arrowColor(tail: string, head: string, action: Action): string {
  let c = color(action);
  if (c) {
    c = ['[#', c, ']'].join('');
  }
  return [tail, c, head].filter(Boolean).join('');
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
  output.push(buffer);
  return output.join('\n');
}

const requestArrow = (action: Action): string => {
  const [caller, callee] = actionActors(action);
  let arrowTokens: { tail: string; head: string };
  if (caller && callee) {
    arrowTokens = { tail: '-', head: '>' };
  } else if (caller) {
    arrowTokens = { tail: '-', head: '>]' };
  } else {
    arrowTokens = { tail: '[-', head: '>' };
  }
  return arrowColor(arrowTokens.tail, arrowTokens.head, action);
};

const responseArrow = (action: Action): string => {
  const [caller, callee] = actionActors(action);
  let arrowTokens: { tail: string; head: string };
  if (caller && callee) {
    arrowTokens = { head: '<', tail: '--' };
  } else if (caller) {
    arrowTokens = { head: '<', tail: '--]' };
  } else {
    arrowTokens = { head: '[<', tail: '--' };
  }
  return arrowColor(arrowTokens.head, arrowTokens.tail, action);
};

class EventLines {
  _indent = 1;

  public lines: string[] = [];

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

export function format(diagram: Diagram, _source: string): string {
  const events = new EventLines();

  const renderChildren = (action: Action) =>
    action.children.forEach((child) => renderAction(child));

  const renderAction = (action: Action): void => {
    events.indent();

    if (isLoop(action)) {
      const colorTag = color(action) ? `#${color(action)} ` : '';
      let countStr = action.count.toString();
      if (hasAncestor(action, (action) => isLoop(action))) countStr = `~${countStr}`;

      events.print(`Loop ${colorTag}${countStr} times`);

      renderChildren(action);

      events.print(`End`);
    } else {
      const actors = actionActors(action);
      {
        const incomingTokens = actors.map((actor) => (actor ? alias(actor.name) : ''));
        const arrow = requestArrow(action);
        events.print(
          [incomingTokens.join(arrow), encode(action, messageDisplayName(action))].join(': ')
        );
      }
      {
        const name = messageName(action);
        if (name.length > DisplayCharLimit) {
          events.print('Note right');
          events.indent();
          events.printLeftAligned(fold(name, 80));
          events.outdent();
          events.print('End note');
        }
      }

      if (action.diffMode) {
        events.print('Note right');
        events.indent();
        events.printLeftAligned(action.diffMode === DiffMode.Delete ? 'deleted' : 'added');
        events.outdent();
        events.print('End note');
      }

      const response = actionResponse(action);
      const doActivate = response && actors[1];
      if (doActivate) {
        assert(actors[1]);
        events.print(`activate ${alias(actors[1].name)}`);
      }
      renderChildren(action);

      if (response) {
        const outgoingTokens = actors.map((actor) => (actor ? alias(actor.name) : ''));
        const arrow = responseArrow(action);

        let returnValueStr: string | undefined;
        if (response.returnValueType?.name) {
          returnValueStr = response.returnValueType?.name;
        } else if (response.status !== undefined) {
          returnValueStr = response.status.toString();
        }

        if (response.raisesException) {
          returnValueStr = ['<i>', returnValueStr || 'exception!', '</i>'].join('');
        }

        if (returnValueStr) returnValueStr = encode(action, returnValueStr);

        events.print([outgoingTokens.join(arrow), returnValueStr].join(': '));
      }

      if (doActivate) {
        assert(actors[1]);
        events.print(`deactivate ${alias(actors[1].name)}`);
      }
    }

    events.outdent();
  };

  diagram.rootActions.forEach((action) => renderAction(action));

  return `@startuml
${diagram.actors
  .map((actor) => `participant ${alias(actor.name)} as "${sanitize(actor.name)}"`)
  .join('\n')}
${events.lines.join('\n')}
@enduml`;
}
