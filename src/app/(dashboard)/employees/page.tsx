'use client';

import { EmptyState } from '@/components/ui/EmptyState';
import Link from 'next/link';

export default function EmployeesPage() {
  return (
    <div className="wu-p-8 wu-bg-white wu-min-h-full">
      <EmptyState
        icon="wm-people"
        title="Employee List"
        description="501 employees in this portal."
        action={
          <Link href="/studies" className="wu-text-sm wu-text-blue-q hover:wu-underline">
            Back to studies
          </Link>
        }
      />
    </div>
  );
}
