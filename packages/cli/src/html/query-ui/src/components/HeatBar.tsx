import React from 'react';
import { heatColor } from '../lib/format';

export default function HeatBar({ value, max, width = 'w-20' }: { value: number | null; max: number; width?: string }) {
  if (value == null || max === 0) return <div className={`${width} h-3 bg-gray-800 rounded`} />;
  const ratio = value / max;
  const widthPercent = Math.max(ratio * 100, 2);
  return (
    <div className={`${width} h-3 bg-gray-800 rounded overflow-hidden`}>
      <div
        className={`h-full rounded ${heatColor(ratio)}`}
        style={{ width: `${widthPercent}%` }}
      />
    </div>
  );
}
