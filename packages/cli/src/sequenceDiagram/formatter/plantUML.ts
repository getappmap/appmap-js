import { Action, Diagram, isLoop, isRequest, isWebRequest, Request, Response } from '../types';

function encode(str: string): string {
  return str.replace(/\n/g, '\\n').replace(/\s{2,}/g, ' ');
}

function alias(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}

const DisplayCharLimit = 50;

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
            encode(action.name.slice(0, DisplayCharLimit)),
          ].join(': ')
      );
      if (action.name.length > DisplayCharLimit) {
        eventLines.push(
          Array(indent * 2).join(' ') + 'Note right',
          Array((indent + 1) * 2).join(' ') + action.name,
          Array(indent * 2).join(' ') + 'End note'
        );
      }

      if (action.children.length > 0) {
        eventLines.push(Array(indent * 2).join(' ') + `activate ${alias(action.callee.name)}`);
        action.children.forEach((child) => renderAction(child, indent + 1));
      }

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

      if (action.children.length > 0) {
        eventLines.push(Array(indent * 2).join(' ') + `deactivate ${alias(action.callee.name)}`);
      }
    } else if (isWebRequest(action)) {
      eventLines.push(
        Array(indent * 2).join(' ') + `[-> ${alias(action.callee.name)}: ${action.route}`,
        Array(indent * 2).join(' ') + `activate ${alias(action.callee.name)}`
      );

      action.children.forEach((child) => renderAction(child, indent + 1));

      eventLines.push(
        Array(indent * 2).join(' ') + `[<- ${alias(action.callee.name)}: ${action.status}`,
        Array(indent * 2).join(' ') + `deactivate ${alias(action.callee.name)}`
      );
    } else if (isLoop(action)) {
      eventLines.push(Array(indent * 2).join(' ') + `Loop ${action.count} times`);

      action.children.forEach((child) => renderAction(child, indent + 1));

      eventLines.push(Array(indent * 2).join(' ') + `End`);
    }
  };

  diagram.rootActions.forEach((action) => renderAction(action));

  return `@startuml
${diagram.actors
  .map((actor) => `participant ${alias(actor.name)} as "${encode(actor.name)}"`)
  .join('\n')}
${eventLines.join('\n')}
@enduml`;
}
