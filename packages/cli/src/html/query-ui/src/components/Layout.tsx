import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS: { path: string; label: string }[] = [
  { path: '/', label: 'Dashboard' },
  { path: '/search', label: 'Search' },
  { path: '/endpoints', label: 'Endpoints' },
  { path: '/sql', label: 'SQL' },
  { path: '/functions', label: 'Functions' },
  { path: '/exceptions', label: 'Exceptions' },
  { path: '/labels', label: 'Labels' },
  { path: '/recordings', label: 'Recordings' },
  { path: '/compare', label: 'Compare' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-8">
        <span className="text-lg font-bold text-blue-400">AppMap Query</span>
        <div className="flex flex-wrap gap-1">
          {NAV_ITEMS.map(({ path, label }) => {
            const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                className={`px-3 py-1.5 rounded text-sm ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
