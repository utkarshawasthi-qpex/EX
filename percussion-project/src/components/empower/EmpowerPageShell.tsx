'use client';

import type { ReactNode } from 'react';

type EmpowerPageShellProps = {
  title: string;
  toolbar?: ReactNode;
  children: ReactNode;
};

export function EmpowerPageShell({ title, toolbar, children }: EmpowerPageShellProps) {
  return (
    <div className="flex flex-col min-h-full bg-[#f5f6f8]">
      <div className="flex-1 p-6 pb-4">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-normal text-gray-400">{title}</h1>
          {toolbar && <div className="flex items-center gap-2 shrink-0">{toolbar}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}
