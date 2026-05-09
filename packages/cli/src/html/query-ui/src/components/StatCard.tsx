import React from 'react';

export default function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-100">{value}</div>
    </div>
  );
}
