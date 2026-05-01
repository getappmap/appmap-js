import sqlite3 from 'better-sqlite3';

import type { CodeObjectType, Label } from '@appland/models';

// Minimal classMap node shape used by the walk. Stays loose to avoid
// coupling to @appland/models per V3 ("no @appland/models for ingestion");
// only leaf type names are imported (type-only).
export interface ClassMapNode {
  type?: CodeObjectType;
  name?: string;
  static?: boolean;
  location?: string;
  labels?: Label[];
  children?: ClassMapNode[];
}

// Walk the classMap tree, insert one code_objects row per function node,
// insert its labels, and return a map of classMap location → code_object_id
// (used by function_calls to link events to code objects via path:lineno).
//
// fqid construction mirrors @appland/models' codeObjectId.js exactly:
//   - between package and child:  '/'
//   - between class and child:    '::'
//   - between any node and a function child:  '.' (static) or '#' (instance)
//
// The defined_class column keeps the prototype's dot-form (resets to bare
// package name on package descent, accumulates on nested classes) — it is
// independent of fqid and pinned by existing tests.
//
// Behavior preserved from the Python prototype:
//   - Function node names with an auxtype suffix like " (get)" are trimmed.
//   - Functions without a location are skipped (e.g., C-extensions).
export function importCodeObjects(
  db: sqlite3.Database,
  classMap: readonly ClassMapNode[]
): Map<string, number> {
  const lookup = new Map<string, number>();

  const insertCodeObject = db.prepare(
    `INSERT OR IGNORE INTO code_objects (fqid, defined_class, method_id) VALUES (?, ?, ?)`
  );
  const selectCodeObjectId = db.prepare(`SELECT id FROM code_objects WHERE fqid = ?`);
  const insertLabel = db.prepare(
    `INSERT OR IGNORE INTO labels (code_object_id, label) VALUES (?, ?)`
  );

  function appendToken(
    parentTokens: readonly string[],
    name: string,
    parentType: CodeObjectType | undefined,
    nodeType: CodeObjectType,
    isStatic: boolean
  ): readonly string[] {
    if (parentTokens.length === 0) return [name];
    let separator = '';
    if (parentType === 'package') separator = '/';
    else if (parentType === 'class') separator = '::';
    if (nodeType === 'function') separator = isStatic ? '.' : '#';
    return [...parentTokens, separator, name];
  }

  function walk(
    node: ClassMapNode,
    classPath: string,
    fqidTokens: readonly string[],
    parentType: CodeObjectType | undefined
  ): void {
    const nodeType = node.type;
    const name = node.name ?? '';

    if (nodeType === 'function') {
      const location = node.location;
      if (!location) return;

      const parenIdx = name.indexOf(' (');
      const methodName = parenIdx >= 0 ? name.slice(0, parenIdx) : name;
      const isStatic = !!node.static;

      const tokens = appendToken(fqidTokens, methodName, parentType, 'function', isStatic);
      const fqid = tokens.join('');

      insertCodeObject.run(fqid, classPath, methodName);
      const row = selectCodeObjectId.get(fqid) as { id: number };
      lookup.set(location, row.id);

      const labels = node.labels ?? [];
      for (const label of labels) insertLabel.run(row.id, label);
      return;
    }

    let nextClassPath: string;
    let nextFqidTokens: readonly string[];
    if (nodeType === 'package') {
      nextClassPath = name;
      nextFqidTokens = appendToken(fqidTokens, name, parentType, 'package', false);
    } else if (nodeType === 'class') {
      nextClassPath = classPath ? `${classPath}.${name}` : name;
      nextFqidTokens = appendToken(fqidTokens, name, parentType, 'class', false);
    } else {
      nextClassPath = classPath;
      nextFqidTokens = fqidTokens;
    }

    const children = node.children ?? [];
    for (const child of children) walk(child, nextClassPath, nextFqidTokens, nodeType ?? parentType);
  }

  for (const root of classMap) walk(root, '', [], undefined);

  return lookup;
}
