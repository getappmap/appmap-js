import type { Action, Actor, Diagram, NodeIdentity } from '../types';
import {
  actionActors,
  DiffMode,
  isClientRPC,
  isFunction,
  isQuery,
  isServerRPC,
  nodeIdentity,
  nodeName,
  nodeResult,
  sameNode,
} from '../types';

export const extension = '.txt';

function diffModeName(diffMode: DiffMode): string {
  switch (diffMode) {
    case DiffMode.Change:
      return 'changed to';
    case DiffMode.Insert:
      return 'added';
    case DiffMode.Delete:
      return 'removed';
    case DiffMode.Move:
      return 'moved';
  }
}

export function format(diagram: Diagram, maxDepth = 4): string {
  const lineCount = new Map<string, number>();
  const lines: string[] = [];
  const describeChange = (action: Action, depth = 1): void => {
    if (depth > maxDepth) return;

    if (action.diffMode !== undefined) {
      const tokens: string[] = [];
      const actor: Actor | undefined = actionActors(action)[1];

      const normalizeName = (str: string): string => {
        return str.replace(/\n/g, ' ');
      };

      const qualifyAction = (str: string): string => {
        if (!actor) return str;

        if (isQuery(action)) {
          return ['SQL', ['', str, ''].join('`')].join(' ');
        } else if (isClientRPC(action)) {
          return ['HTTP client request', ['', str, ''].join('`')].join(' ');
        } else if (isServerRPC(action)) {
          return ['HTTP server request', ['', str, ''].join('`')].join(' ');
        } else {
          const separator = isFunction(action) ? (action.static ? '.' : '#') : '#';
          return ['function call', ['', [actor.name, str].join(separator), ''].join('`')].join(' ');
        }
      };

      if (action.diffMode === DiffMode.Change) {
        const formerName = action.formerName
          ? qualifyAction(normalizeName(action.formerName))
          : undefined;
        const currentName = nodeName(action)
          ? qualifyAction(normalizeName(nodeName(action)))
          : undefined;

        const formerResult = action.formerResult ? normalizeName(action.formerResult) : undefined;
        const currentResult = nodeResult(action) ? normalizeName(nodeResult(action)!) : undefined;

        if (formerName !== currentName) {
          tokens.push('changed');
          tokens.push(formerName || 'undefined');
          tokens.push('to');
          tokens.push(currentName || 'undefined');
        }
        if (formerResult !== currentResult) {
          if (tokens.length === 0) {
            tokens.push('changed');
            tokens.push(currentName || 'undefined');
          } else {
            tokens.push('and');
            tokens.push('changed');
          }
          tokens.push('to return');
          tokens.push(currentResult || 'undefined');
          tokens.push('instead of');
          tokens.push(formerResult || 'undefined');
        }
      } else if (action.diffMode === DiffMode.Move) {
        // The same block, now under a different parent, or in a different place
        // among its siblings when the parent is the same. The parents are compared
        // by identity rather than by name, so a block that moved between two
        // same-named methods on different actors is not called a reorder.
        const newParent = action.parent ? nodeIdentity(action.parent) : undefined;
        const oldParent = action.movedFrom;
        const reordered = sameNode(oldParent, newParent);
        const parentName = (parent: NodeIdentity | undefined): string =>
          parent ? ['', normalizeName(parent.name), ''].join('`') : 'the top level';

        tokens.push(reordered ? 'reordered' : 'moved');
        tokens.push(qualifyAction(normalizeName(nodeName(action))));
        tokens.push(reordered ? 'within' : 'from');
        tokens.push(parentName(reordered ? newParent : oldParent));
      } else {
        tokens.push(diffModeName(action.diffMode));
        tokens.push(qualifyAction(normalizeName(nodeName(action))));
      }

      if (tokens.length > 0) {
        const message = [new Array(depth).join('  '), tokens.join(' ')].join('');
        if (lineCount.has(message)) {
          lineCount.set(message, lineCount.get(message)! + 1);
        } else {
          lineCount.set(message, 1);
          lines.push(message);
        }
      }

      depth += 1;
    }
    action.children.forEach((child) => describeChange(child, depth));
  };

  diagram.rootActions.forEach((action) => describeChange(action));

  return lines
    .map((line) => {
      const count = lineCount.get(line);
      return count === 1 ? line : [`${count} times`, line].join(': ');
    })
    .join('\n');
}
