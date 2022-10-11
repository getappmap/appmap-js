import { Action, Diagram, isLoop, isRequest, Request, Response } from '../types';

function encode(str: string): string {
  return `"${str
    .replace(/\n/g, '\\n')
    .replace(/\s{2,}/g, ' ')}"`;
}

function alias(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}

export const extension = '.uml';

export function format(diagram: Diagram): string {
  const requestArrow = (message: Request): string => '->';
  const responseArrow = (_message: Response): string => '-->';

  const eventLines: string[] = [];

  const renderAction = (action: Action, indent = 1): void => {
    if (isRequest(action)) {
      eventLines.push(
        Array(indent * 2).join(' ') +
          [
            [alias(action.caller.name), alias(action.callee.name)].join(requestArrow(action)),
            encode(action.name),
          ].join(': ')
      );

      action.children.forEach((child) => renderAction(child, indent));

      if (action.response) {
        eventLines.push(
          Array(indent * 2).join(' ') +
            [
              [alias(action.callee.name), alias(action.caller.name)].join(
                responseArrow(action.response)
              ),
              encode(action.response.returnValueType?.name || 'unknown type'),
            ].join(': ')
        );
      }
    } else if (isLoop(action)) {
      eventLines.push(Array(indent * 2).join(' ') + `Loop ${action.count} times`);

      action.children.forEach((child) => renderAction(child, indent + 1));

      eventLines.push(Array(indent * 2).join(' ') + `End`);
    }
  };

  diagram.rootActions.forEach((action) => renderAction(action));

  return `@startuml
${diagram.actors
  .map((actor) => `participant ${alias(actor.name)} as ${encode(actor.name)}`)
  .join('\n')}
${eventLines.join('\n')}
@enduml`;
}
