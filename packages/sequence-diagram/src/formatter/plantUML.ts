import { diffChars } from 'diff';
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
  nodeResult,
  nodeName,
} from '../types';

const DisplayCharLimit = 50;

export const extension = '.uml';

function formatElapsed(elapsed: number): string {
  const timeStr = (): string => {
    return `${+(elapsed * 1000).toPrecision(3)} ms`;
  };
  return `<color:gray> ${timeStr()}</color>`;
}

function singleLine(str: string): string {
  return str.replace(/\n/g, '\\n').replace(/\s{2,}/g, ' ');
}

class Label {
  static ChangedCharsThreshod = 0.25;

  static GitHubDiffLightThemeRemovedColorBackground = '#FCECEA'; // [ 252, 236, 234 ];
  static GitHubDiffLightThemeAddedColorBackground = '#EBFEEE'; // [ 235, 254, 238 ];

  static GitHubDiffDarkThemeRemovedColorBackground = '#29201A'; // [ 41, 32, 26 ];
  static GitHubDiffDarkThemeAddedColorBackground = '#172238'; // [ 23, 34, 56 ];

  static RemovedColor = 'lightgray';
  static AddedColor = 'lightgray';

  static RemovedColorBackground = Label.GitHubDiffDarkThemeRemovedColorBackground;
  static AddedColorBackground = Label.GitHubDiffDarkThemeAddedColorBackground;

  constructor(public action: FunctionCall | ServerRPC | ClientRPC | Query) {}

  get actionNameIsTrimmed(): boolean {
    return nodeName(this.action).length > DisplayCharLimit;
  }

  requestLabel(): string {
    const { action } = this;

    const label = singleLine(nodeName(this.action)).slice(0, DisplayCharLimit);
    let formerLabel;
    if (action.formerName) formerLabel = singleLine(action.formerName).slice(0, DisplayCharLimit);

    const formattedLabel = this.formatDiffLabel(label, formerLabel);

    const tokens: string[] = [];
    // PlantUML / Creole doesn't successfully combine strikethrough with underline.
    // Only the underline ends up being rendered.
    if (isFunction(action) && action.static && action.diffMode !== DiffMode.Delete)
      tokens.push('<u>');
    tokens.push(formattedLabel);
    if (isFunction(action) && action.static && action.diffMode !== DiffMode.Delete)
      tokens.push('</u>');

    if (action.elapsed && action.diffMode !== DiffMode.Delete) {
      tokens.push(' ');
      tokens.push(formatElapsed(action.elapsed));
    }
    return tokens.join('');
  }

  responseLabel(): string | undefined {
    const response = actionResponse(this.action);
    if (!response) return;

    let label = nodeResult(this.action);
    if (!label) return;

    label = singleLine(label).slice(0, DisplayCharLimit);

    let formerLabel;
    if (this.action.formerResult)
      formerLabel = singleLine(this.action.formerResult).slice(0, DisplayCharLimit);

    const formattedLabel = this.formatDiffLabel(label, formerLabel);

    const tokens: string[] = [];

    if (response.raisesException) tokens.push('<i>');
    tokens.push(formattedLabel);
    if (response.raisesException) tokens.push('</i>');

    return tokens.join('');
  }

  note(foldLimit = 80): string {
    const { action } = this;

    const label = fold(nodeName(this.action), foldLimit);
    let formerLabel: string[] = [];
    if (action.formerName) formerLabel = fold(action.formerName, foldLimit);

    const result = [];
    for (let i = 0; i < Math.max(label.length, formerLabel.length); i += 1) {
      const line = this.formatDiffLabel(label[i], formerLabel[i]);
      result.push(line);
    }
    return result.join('\n');
  }

  private formatDiffLabel(label?: string, formerLabel?: string): string {
    const tokens: string[] = [];

    const addedSegment = (text: string): void => {
      tokens.push(`<color:${Label.AddedColor}><back:${Label.AddedColorBackground}>`);
      tokens.push(text);
      tokens.push('</back></color>');
    };
    const removedSegment = (text: string): void => {
      tokens.push(`<color:${Label.RemovedColor}><back:${Label.RemovedColorBackground}>--`);
      tokens.push(text);
      tokens.push('--</back></color>');
    };

    if (this.action.diffMode === DiffMode.Change && label && formerLabel && label !== formerLabel) {
      const diff = diffChars(formerLabel, label);
      const changeCharsCount = diff.reduce(
        (memo, change) => (change.added || change.removed ? memo + (change.count || 0) : memo),
        0
      );
      if (
        changeCharsCount / Math.max(formerLabel.length, label.length) <
        Label.ChangedCharsThreshod
      ) {
        for (const change of diff) {
          if (change.removed) {
            removedSegment(change.value);
          } else if (change.added) {
            addedSegment(change.value);
          } else {
            tokens.push(change.value);
          }
        }
      } else {
        removedSegment(formerLabel);
        tokens.push(' ');
        addedSegment(label);
      }
    } else if (this.action.diffMode && label && formerLabel && label === formerLabel) {
      tokens.push(label);
    } else if (label) {
      if (this.action.diffMode) {
        this.action.diffMode === DiffMode.Delete ? removedSegment(label) : addedSegment(label);
      } else {
        tokens.push(label);
      }
    }
    return tokens.join('');
  }
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

function alias(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}

function color(action: Action): string | undefined {
  switch (action.diffMode) {
    case DiffMode.Delete:
      return 'red';
    case DiffMode.Insert:
      return 'green';
    case DiffMode.Change:
      return 'CA9C3F';
  }
}

function arrowColor(tail: string, head: string, action: Action): string {
  let c = color(action);
  if (c) {
    c = ['[#', c, ']'].join('');
  }
  return [tail, c, head].filter(Boolean).join('');
}

function fold(line: string, limit: number): string[] {
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
  return output;
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
      const colorTag = color(action) ? `#${color(action)}` : '';
      let countStr = action.count.toString();
      if (hasAncestor(action, (action) => isLoop(action))) countStr = `~${countStr}`;

      const tokens = [`${countStr} times`];
      if (action.elapsed) {
        tokens.push(` ${formatElapsed(action.elapsed)}`);
      }
      events.print(`Loop${colorTag} ${tokens.join('')}`);

      renderChildren(action);

      events.print(`End`);
    } else {
      const label = new Label(action);

      const actors = actionActors(action);
      {
        const incomingTokens = actors.map((actor) => (actor ? alias(actor.name) : ''));
        const arrow = requestArrow(action);
        events.print([incomingTokens.join(arrow), label.requestLabel()].join(': '));
      }
      {
        if (label.actionNameIsTrimmed) {
          events.print('Note right');
          events.indent();
          events.printLeftAligned(label.note(80));
          events.outdent();
          events.print('End note');
        }
      }

      const response = actionResponse(action);
      const doActivate = response && actors[1];
      if (doActivate) {
        if (!actors[1]) throw Error();
        events.print(`activate ${alias(actors[1].name)}`);
      }
      renderChildren(action);

      if (response) {
        const outgoingTokens = actors.map((actor) => (actor ? alias(actor.name) : ''));
        const arrow = responseArrow(action);
        const responseLabel = label.responseLabel();

        const tokens = [outgoingTokens.join(arrow)];
        if (responseLabel) tokens.push(responseLabel);

        events.print(tokens.join(': '));
      }

      if (doActivate) {
        if (!actors[1]) throw Error();
        events.print(`deactivate ${alias(actors[1].name)}`);
      }
    }

    events.outdent();
  };

  diagram.rootActions.forEach((action) => renderAction(action));

  return `@startuml
!includeurl https://raw.githubusercontent.com/getappmap/plantuml-theme/main/appmap-theme.puml
${diagram.actors
  .map((actor) => `participant ${alias(actor.name)} as "${singleLine(actor.name)}"`)
  .join('\n')}
${events.lines.join('\n')}
@enduml`;
}
