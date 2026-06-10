import React, { useState } from 'react';
import type { Column } from './Table';

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  isExpandable?: (row: T) => boolean;
  renderExpanded: (row: T) => React.ReactNode;
}

export default function ExpandableTable<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey,
  isExpandable,
  renderExpanded,
}: Props<T>) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (rows.length === 0) {
    return <div className="text-gray-500 text-sm py-2">No results.</div>;
  }

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-800">
            <th className="w-6"></th>
            {columns.map((c) => (
              <th key={c.key} className={`py-2 px-2 font-normal ${c.className ?? ''}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const key = rowKey(row);
            const isOpen = expanded.has(key);
            const canExpand = isExpandable ? isExpandable(row) : true;
            return (
              <React.Fragment key={key}>
                <tr
                  className={`border-b border-gray-900 ${canExpand ? 'cursor-pointer hover:bg-gray-800/50' : ''}`}
                  onClick={canExpand ? () => toggle(key) : undefined}
                >
                  <td className="py-2 px-2 align-top text-gray-600">
                    {canExpand ? (isOpen ? '▼' : '▶') : ''}
                  </td>
                  {columns.map((c) => {
                    const v = c.render ? c.render(row) : String(row[c.key] ?? '-');
                    return (
                      <td key={c.key} className={`py-2 px-2 align-top ${c.className ?? ''}`}>
                        {v as React.ReactNode}
                      </td>
                    );
                  })}
                </tr>
                {isOpen && canExpand && (
                  <tr className="bg-gray-950 border-b border-gray-900">
                    <td colSpan={columns.length + 1} className="px-4 py-3">
                      {renderExpanded(row)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
