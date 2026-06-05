import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

export const StatCard = ({ label, value, icon }: StatCardProps) => (
  <div className="bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm">
    <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 mb-2">
      <span className="shrink-0">{icon}</span>
      <span className="text-[9px] uppercase font-bold tracking-widest">{label}</span>
    </div>
    <div className="text-xl font-display font-bold text-zinc-900 dark:text-zinc-100">
      {value}
    </div>
  </div>
);
