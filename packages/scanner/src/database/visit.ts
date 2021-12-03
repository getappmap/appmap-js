type Callback = (node: any, callbacks?: Record<string, Callback>) => void;

export function visit(node: any, callbacks?: Record<string, Callback>): void {
  const { type, variant } = node;
  const key = [type, variant].filter(Boolean).join('.');

  if (callbacks !== undefined && key in callbacks) callbacks[key](node, callbacks);
  visitNode(node, callbacks);
}

function visitNode(node: any, callbacks?: Record<string, Callback>): void {
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
