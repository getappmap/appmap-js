import { Action, Diagram, isLoop, isRequest, Request, Response } from '../types';

const MarkdownDelimiter = '```';
const DisplayCharLimit = 50;

function encode(str: string): string {
  let printable = str;
  const match = str.match(/<#?([^>\]]+)[>\]]/);
  if (match) printable = match[1];
  return printable
    .replace(/[\u00A0-\u9999<>\&]/g, function (i) {
      return '&#' + i.charCodeAt(0) + ';';
    })
    .replace(/[:]/g, '_')
    .slice(0, DisplayCharLimit);
}

function alias(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}

export const extension = '.md';

export function format(diagram: Diagram, source: string): string {
  const requestArrow = (message: Request): string => (message.response ? '->>+' : '->>');
  const responseArrow = (_message: Response): string => '-->>';

  const eventLines: string[] = [];

  const renderAction = (action: Action, indent = 1): void => {
    if (isRequest(action)) {
      eventLines.push(
        Array(indent * 2).join(' ') +
          [
            [alias(action.caller.name), alias(action.callee.name)].join(requestArrow(action)),
            encode(action.name.split('\n').join(' ')),
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
              encode(action.response.returnValueType?.name.split('\n').join(' ') || 'unknown type'),
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

  return `${MarkdownDelimiter}mermaid
%% Source: ${source}
sequenceDiagram
  ${diagram.actors
    .map((actor) => `participant ${alias(actor.name)} as ${encode(actor.name)}`)
    .join('\n  ')}
  ${eventLines.join('\n  ')}
${MarkdownDelimiter}`;
}
