'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MOCK_STUDIES } from '@/data/mock-studies';
import { formatStudyDate } from '@/data/mock-utils';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHeading })),
  { ssr: false }
);

export default function StudyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const study = MOCK_STUDIES.find((s) => s.id === id);

  if (!study) {
    return (
      <div className="wu-p-8 wu-bg-white wu-min-h-full">
        <WuHeading size="lg">Study not found</WuHeading>
        <Link href="/studies" className="wu-text-blue-q wu-text-sm hover:wu-underline wu-mt-4 wu-inline-block">
          Back to studies
        </Link>
      </div>
    );
  }

  return (
    <div className="wu-p-8 wu-bg-white wu-min-h-full">
      <Link
        href="/studies"
        className="wu-inline-flex wu-items-center wu-gap-1 wu-text-sm wu-text-gray-subtle hover:wu-text-gray-lead wu-mb-4"
      >
        <span className="wm-arrow-back" /> Back to studies
      </Link>
      <WuHeading size="lg" className="wu-text-gray-lead wu-mb-2">
        {study.name}
      </WuHeading>
      <p className="wu-text-sm wu-text-gray-subtle wu-mb-6">
        Created {formatStudyDate(study.createdAt)} · {study.responses} responses ·{' '}
        {study.deployments} deployments
      </p>
      <WuButton onClick={() => {}}>Analyze</WuButton>
    </div>
  );
}
