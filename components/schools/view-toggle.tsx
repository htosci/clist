'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { LayoutGrid, Map } from 'lucide-react';
import { useTranslations } from 'next-intl';

type View = 'grid' | 'map';

export function ViewToggle({ currentView }: { currentView: View }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('schools');

  const switchTo = (view: View) => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === 'grid') {
      params.delete('view');
    } else {
      params.set('view', view);
    }
    // При переключении вида сбрасываем страницу пагинации
    params.delete('page');
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ''}`);
  };

  return (
    <div role="group" aria-label="Вид отображения" className="flex items-center gap-1 border rounded-lg p-1 bg-muted/40 shrink-0">
      <button
        onClick={() => switchTo('grid')}
        title={t('viewToggle.grid')}
        aria-label={t('viewToggle.grid')}
        aria-pressed={currentView === 'grid'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
          currentView === 'grid'
            ? 'bg-background shadow-sm font-medium'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">{t('viewToggle.grid')}</span>
      </button>
      <button
        onClick={() => switchTo('map')}
        title={t('viewToggle.map')}
        aria-label={t('viewToggle.map')}
        aria-pressed={currentView === 'map'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
          currentView === 'map'
            ? 'bg-background shadow-sm font-medium'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Map className="w-4 h-4" />
        <span className="hidden sm:inline">{t('viewToggle.map')}</span>
      </button>
    </div>
  );
}
