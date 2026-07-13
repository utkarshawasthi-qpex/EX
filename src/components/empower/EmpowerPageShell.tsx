'use client';

import type { ReactNode } from 'react';

type EmpowerPageShellProps = {
  title: string;
  toolbar?: ReactNode;
  children: ReactNode;
};

export function EmpowerPageShell({ title, toolbar, children }: EmpowerPageShellProps) {
  return (
    <div className="flex min-h-full flex-col bg-[#f5f6f8]">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gray-200 bg-[#f5f6f8] px-6 pt-6 pb-4">
        <h1 className="text-3xl font-normal text-gray-400">{title}</h1>
        {toolbar && <div className="flex shrink-0 items-center gap-2">{toolbar}</div>}
      </header>
      <div className="flex-1 px-6 pb-6 pt-4">{children}</div>
    </div>
  );
}
