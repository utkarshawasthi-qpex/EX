'use client';

import { EmpowerFooter } from '@/components/empower/EmpowerFooter';

export default function EmpowerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-full">
      {children}
      <EmpowerFooter />
    </div>
  );
}
