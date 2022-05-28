import { SqliteParser } from '@appland/models/types/sqlite-parser';

type Callbacks = {
  [Node in SqliteParser.Node as `${Node['type']}.${Node['variant']}`]?: (node: Node) => void;
};

export function visit(node: SqliteParser.Node, callbacks: Callbacks): void {
  if (node === null) return;

  const { type, variant } = node;
  const key = [type, variant].filter(Boolean).join('.') as keyof Callbacks;

  if (key in callbacks) {
    const callback = callbacks[key] as (node: SqliteParser.Node) => void;
    callback(node);
  }
  visitNode(node, callbacks);
}

function visitNode(node: SqliteParser.Node, callbacks: Callbacks): void {
  for (const [key, property] of Object.entries(node)) {
    if (['type', 'variant', 'name', 'value'].includes(key)) continue;
    if (Array.isArray(property)) {
      for (const subNode of property) visit(subNode, callbacks);
    } else if (typeof property === 'object') {
      visit(property, callbacks);
    } else if (typeof property === 'string' || typeof property === 'boolean') {
      // pass
    } else {
      console.warn(`Unrecognized subexpression: ${typeof property} ${property}`);
    }
  }
}
