import { Diagram, isRequest, isResponse, Request, Response, Type } from './types';

const MarkdownDelimiter = '```';
const DisplayCharLimit = 50;

const DisplayNames = {
  'http:HTTP server requests': 'Web server',
};

export function displayName(fqid: string): string {
  if (DisplayNames[fqid]) return DisplayNames[fqid];

  let tokens = fqid.split(':');
  tokens.shift();
  let name = tokens.join(':');
  if (name.includes('/')) name = name.split('/').pop()!;

  return name;
}

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

export default function mermaid(diagram: Diagram): string {
  const requestArrow = (message: Request): string => (message.response ? '->>+' : '->>');
  const responseArrow = (_message: Response): string => '-->>';

  const eventLines: string[] = [];
  diagram.messages.forEach((message) => {
    let line: string | undefined;
    if (isRequest(message)) {
      const arrow = requestArrow(message);
      line = [
        [alias(message.caller.name), alias(message.callee.name)].join(arrow),
        encode(message.name),
      ].join(': ');
    } else if (isResponse(message)) {
      const arrow = responseArrow(message);
      line = [
        [alias(message.request.callee.name), alias(message.request.caller.name)].join(arrow),
        encode(message.returnValueType?.name || 'unknown type'),
      ].join(': ');
    }
    if (line) eventLines.push(line);
  });

  return `${MarkdownDelimiter}mermaid
%% AppMap: ${diagram.appmapFile}
sequenceDiagram
  ${diagram.actors
    .map((actor) => `participant ${alias(actor.name)} as ${encode(actor.name)}`)
    .join('\n  ')}
  ${eventLines.join('\n  ')}
${MarkdownDelimiter}`;
}
