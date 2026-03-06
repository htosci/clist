'use client';

import { useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getSchoolsPath } from '@/i18n/navigation';
import type { SchoolMapMarker } from '@/lib/schema-config';
type Props = {
  schools: SchoolMapMarker[];
};

// Экранирование HTML для безопасной вставки в setHTML
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Цвета маркеров по категории школы
function getCategoryColor(category: string | null): string {
  if (!category) return '#607D8B';
  const c = category.toLowerCase();
  if (c.includes('montessori')) return '#4CAF50';
  if (c.includes('ib')) return '#2196F3';
  if (c.includes('waldorf')) return '#9C27B0';
  if (c.includes('religia') || c.includes('catholic') || c.includes('katoli')) return '#FF9800';
  return '#607D8B';
}

function buildGeoJSON(schools: SchoolMapMarker[]) {
  return {
    type: 'FeatureCollection' as const,
    features: schools.map((s) => {
      const stages = [s.wychowanie_przedszkolne, s.i_etap_edukacyjny, s.ii_etap_edukacyjny];
      const stageCount = stages.filter(Boolean).length;
      const category = s.school_category?.[0] ?? null;
      const langCode = s.instruction_languages?.[0]?.slice(0, 2).toUpperCase() ?? '';

      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [s.lng, s.lat],
        },
        properties: {
          numer_rspo: s.numer_rspo,
          nazwa: s.nazwa,
          total_annual_cost: s.total_annual_cost,
          instruction_languages: s.instruction_languages ? s.instruction_languages.join(', ') : null,
          category,
          color: getCategoryColor(category),
          stage_count: stageCount || 1,
          lang_code: langCode,
        },
      };
    }),
  };
}

export default function SchoolMap({ schools }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('maplibre-gl').Map | null>(null);
  const locale = useLocale();
  const t = useTranslations('map');

  const schoolsPath = getSchoolsPath(locale);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Флаг для отмены async-инициализации если компонент размонтировался до resolve
    let cancelled = false;

    import('maplibre-gl').then((maplibre) => {
      if (cancelled || !containerRef.current) return;

      // CSP-совместимый воркер (Next.js/Turbopack блокирует blob: workers)
      maplibre.setWorkerUrl('/maplibre-gl-csp-worker.js');

      const map = new maplibre.Map({
        container: containerRef.current,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [19.5, 52.0],
        zoom: 6,
      });

      mapRef.current = map;

      map.on('load', () => {
        const geojson = buildGeoJSON(schools);

        // Источник с кластеризацией
        map.addSource('schools', {
          type: 'geojson',
          data: geojson,
          cluster: true,
          clusterMaxZoom: 12,
          clusterRadius: 50,
        });

        // --- Кластеры (круги) ---
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'schools',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#6366f1',
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              18,   // < 10
              10, 24,  // 10-50
              50, 32,  // > 50
            ],
            'circle-opacity': 0.85,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
        });

        // --- Лейбл кластера ---
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'schools',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['Noto Sans Regular'],
            'text-size': 13,
          },
          paint: {
            'text-color': '#fff',
          },
        });

        // --- Отдельные точки ---
        map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'schools',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': [
              'interpolate', ['linear'],
              ['get', 'stage_count'],
              1, 8,
              2, 11,
              3, 14,
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
            'circle-opacity': 0.9,
          },
        });

        // --- Код языка (zoom ≥ 13) ---
        map.addLayer({
          id: 'lang-label',
          type: 'symbol',
          source: 'schools',
          filter: ['!', ['has', 'point_count']],
          minzoom: 13,
          layout: {
            'text-field': ['get', 'lang_code'],
            'text-font': ['Noto Sans Bold'],
            'text-size': 9,
            'text-allow-overlap': true,
          },
          paint: {
            'text-color': '#fff',
          },
        });

        // --- Zoom-in при клике по кластеру ---
        map.on('click', 'clusters', (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
          if (!features.length || !features[0].properties) return;
          const clusterId = features[0].properties.cluster_id as number;
          const source = map.getSource('schools') as import('maplibre-gl').GeoJSONSource;
          source.getClusterExpansionZoom(clusterId).then((zoom) => {
            const coords = (features[0].geometry as GeoJSON.Point).coordinates as [number, number];
            map.easeTo({ center: coords, zoom });
          });
        });

        // --- Попап при клике по школе ---
        map.on('click', 'unclustered-point', (e) => {
          if (!e.features?.length) return;
          const props = e.features[0].properties;
          if (!props) return;
          const coords = (e.features[0].geometry as GeoJSON.Point).coordinates.slice() as [number, number];

          const priceText = props.total_annual_cost
            ? `${props.total_annual_cost.toLocaleString()} ${escapeHtml(t('currency'))}`
            : escapeHtml(t('priceOnRequest'));

          const langText = props.instruction_languages ? escapeHtml(props.instruction_languages as string) : '';

          const popupHtml = `
            <div style="min-width:180px;max-width:240px;font-family:system-ui,sans-serif;">
              <div style="font-weight:600;font-size:14px;margin-bottom:6px;line-height:1.3;">${escapeHtml(props.nazwa as string)}</div>
              ${langText ? `<div style="font-size:12px;color:#666;margin-bottom:4px;">${langText}</div>` : ''}
              <div style="font-size:13px;font-weight:500;color:#4f46e5;margin-bottom:8px;">${priceText}</div>
              <a href="${schoolsPath}/${props.numer_rspo}"
                 style="display:inline-block;padding:5px 10px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;font-size:12px;">
                ${escapeHtml(t('openSchool'))}
              </a>
            </div>
          `;

          new maplibre.Popup({ maxWidth: '260px', closeButton: true })
            .setLngLat(coords)
            .setHTML(popupHtml)
            .addTo(map);
        });

        // Курсор pointer при наведении
        map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });
        map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = ''; });
      });
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // Намеренно пустые deps: карта инициализируется один раз при монтировании.
  // schools и schoolsPath читаются актуальными через второй useEffect и closure в click-хендлерах.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Обновляем данные при изменении фильтров (без пересоздания карты)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const updateSource = () => {
      const source = map.getSource('schools') as import('maplibre-gl').GeoJSONSource | undefined;
      if (source) {
        source.setData(buildGeoJSON(schools));
      }
    };

    if (map.isStyleLoaded()) {
      updateSource();
    } else {
      map.once('load', updateSource);
      // Cleanup: снимаем подписку если schools изменится до load
      return () => { map.off('load', updateSource); };
    }
  }, [schools]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border h-[600px]">
      <div ref={containerRef} className="w-full h-full" />
      {schools.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 text-muted-foreground text-sm">
          {t('noCoordinates')}
        </div>
      )}
    </div>
  );
}
