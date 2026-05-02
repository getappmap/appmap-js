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
// Each function is decomposed into:
//   - package : slash-joined package path  (e.g. "app/services/idempotency")
//   - class   : ::-joined class chain      (e.g. "Outer::Inner")
//   - method  : leaf method name           (e.g. "generate")
//   - is_static : 1 for static, 0 for instance
//
// fqid is derived from these and matches @appland/models' codeObjectId.js:
//   - between package and class:           '/'
//   - between class and child class:       '::'
//   - between class and function method:   '.' (static) or '#' (instance)
//
// Behavior preserved from the Python prototype:
//   - Function node names with an auxtype suffix like " (get)" are trimmed.
//   - Functions without a location are skipped (e.g., C-extensions).
//   - When descending from a package, the class chain resets (a class
//     directly under a package starts a fresh chain).
export function importCodeObjects(
  db: sqlite3.Database,
  classMap: readonly ClassMapNode[]
): Map<string, number> {
  const lookup = new Map<string, number>();

  const insertCodeObject = db.prepare(
    `INSERT OR IGNORE INTO code_objects (fqid, package, classes, leaf_class, method, is_static)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const selectCodeObjectId = db.prepare(`SELECT id FROM code_objects WHERE fqid = ?`);
  const insertLabel = db.prepare(
    `INSERT OR IGNORE INTO labels (code_object_id, label) VALUES (?, ?)`
  );

  function buildFqid(
    packageTokens: readonly string[],
    classTokens: readonly string[],
    method: string,
    isStatic: boolean
  ): string {
    const pkg = packageTokens.join('/');
    const cls = classTokens.join('::');
    const methodSep = isStatic ? '.' : '#';
    if (pkg && cls) return `${pkg}/${cls}${methodSep}${method}`;
    if (pkg) return `${pkg}${methodSep}${method}`;
    if (cls) return `${cls}${methodSep}${method}`;
    return `${methodSep}${method}`;
  }

  function walk(
    node: ClassMapNode,
    packageTokens: readonly string[],
    classTokens: readonly string[]
  ): void {
    const nodeType = node.type;
    const name = node.name ?? '';

    if (nodeType === 'function') {
      const location = node.location;
      if (!location) return;

      const parenIdx = name.indexOf(' (');
      const methodName = parenIdx >= 0 ? name.slice(0, parenIdx) : name;
      const isStatic = !!node.static;

      const fqid = buildFqid(packageTokens, classTokens, methodName, isStatic);

      const leafClass = classTokens.length > 0 ? classTokens[classTokens.length - 1] : '';
      insertCodeObject.run(
        fqid,
        packageTokens.join('/'),
        JSON.stringify([...classTokens]),
        leafClass,
        methodName,
        isStatic ? 1 : 0
      );
      const row = selectCodeObjectId.get(fqid) as { id: number };
      lookup.set(location, row.id);

      const labels = node.labels ?? [];
      for (const label of labels) insertLabel.run(row.id, label);
      return;
    }

    let nextPackageTokens = packageTokens;
    let nextClassTokens = classTokens;
    if (nodeType === 'package') {
      nextPackageTokens = [...packageTokens, name];
      nextClassTokens = []; // package descent resets the class chain
    } else if (nodeType === 'class') {
      nextClassTokens = [...classTokens, name];
    }

    const children = node.children ?? [];
    for (const child of children) walk(child, nextPackageTokens, nextClassTokens);
  }

  for (const root of classMap) walk(root, [], []);

  return lookup;
}
