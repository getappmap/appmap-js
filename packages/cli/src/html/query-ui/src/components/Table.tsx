import React from 'react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
}

export default function Table<T extends Record<string, unknown>>({
  columns,
  rows,
  rowKey,
  onRowClick,
}: Props<T>) {
  if (rows.length === 0) {
    return <div className="text-gray-500 text-sm py-2">No results.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-800">
            {columns.map((c) => (
              <th key={c.key} className={`py-2 px-2 font-normal ${c.className ?? ''}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey ? rowKey(row, i) : i}
              className={`border-b border-gray-900 ${onRowClick ? 'cursor-pointer hover:bg-gray-800/50' : ''}`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c) => {
                const v = c.render ? c.render(row) : String(row[c.key] ?? '-');
                return (
                  <td key={c.key} className={`py-2 px-2 align-top ${c.className ?? ''}`}>
                    {v as React.ReactNode}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
