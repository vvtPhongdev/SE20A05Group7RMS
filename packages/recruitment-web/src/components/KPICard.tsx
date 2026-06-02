import React from 'react';

interface KPICardProps {
  title: string;
  value: string;
  subtext?: string;
}

export const KPICard = ({ title, value, subtext }: KPICardProps) => (
  <div className="bg-white p-6 rounded-xl border border-[#D6CEC4]/60 shadow-sm transition-all hover:-translate-y-1">
    <div className="flex justify-between items-start mb-4">
      <span className="text-sm text-slate-500">{title}</span>
    </div>
    <div className="text-3xl font-bold text-[#1C1917]">{value}</div>
    {subtext && <p className="text-xs mt-1 text-slate-500">{subtext}</p>}
  </div>
);