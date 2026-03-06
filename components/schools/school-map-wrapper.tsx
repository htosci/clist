'use client';

import dynamic from 'next/dynamic';
import type { SchoolMapMarker } from '@/lib/schema-config';

const SchoolMap = dynamic(() => import('./school-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-xl border bg-muted animate-pulse h-[600px]" />
  ),
});

export function SchoolMapWrapper({ schools }: { schools: SchoolMapMarker[] }) {
  return <SchoolMap schools={schools} />;
}
