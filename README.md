# Clist

Агрегатор частных (непубличных) школ Польши. Родители могут искать, фильтровать и сортировать школы по параметрам: цена, программа, языки обучения, методика, местоположение. Интерфейс мультиязычный: польский (дефолт, `/`) и русский (`/ru/`).

**Продакшн:** Vercel | **БД:** Supabase | **Сбор данных:** n8n (Render.com)

---

## Стек

| Слой | Технология |
|------|------------|
| Фреймворк | Next.js 16 (App Router) + React 19 + TypeScript strict |
| Стили | Tailwind CSS v4 + shadcn/ui (стиль new-york) |
| База данных | Supabase (PostgreSQL) |
| Мультиязычность | next-intl (middleware + Server/Client Components) |
| Иконки | lucide-react |
| Деплой | Vercel |

---

## Быстрый старт

### 1. Переменные окружения

Создать `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 2. Команды

```bash
npm run dev           # dev server на порту 3000
npm run build         # production build
npm run start         # запуск production
npm run lint          # ESLint
npm run test          # Vitest watch
npm run test:coverage # однократный прогон + coverage
```

---

## Архитектура

### Server / Client разделение

- **Server Components** (`app/[locale]/schools/page.tsx`, `school-grid.tsx`, `school-detail-*.tsx`) — запрашивают данные из Supabase, передают в клиентские компоненты
- **Client Components** (`filter-bar.tsx`, `school-card.tsx`, `school-map.tsx`, `view-toggle.tsx`) — интерактивность, фильтры, анимации, карта

### URL как хранилище состояния фильтров

Все параметры фильтрации хранятся в query string:
```
/schools?wojewodztwo=mazowieckie&sort=price_asc&page=2
```
- Сброс фильтров = `router.push(pathname)` без параметров
- Shareable URLs, работает кнопка «Назад»

### Кэширование

`getFilterOptions()` кэшируется через `unstable_cache` с ISR на 1 час (тег `['filters']`).
Ревалидация: `revalidateTag('filters')`.

---

## Структура папок

```
app/
  layout.tsx              # Root layout: <html lang={locale}> через getLocale(), шрифты Geist
  robots.ts               # Генерирует /robots.txt
  sitemap.ts              # Генерирует /sitemap.xml через getSchoolsForSitemap()
  [locale]/               # Локализованные маршруты (pl — без префикса, ru — /ru/)
    layout.tsx            # Обёртка NextIntlClientProvider (без html/body)
    page.tsx              # Главная: Hero, кнопки-префильтры по городам, блок УТП
    schools/
      page.tsx            # Каталог школ — Server Component, параллельный fetch, metadata, OG
      loading.tsx         # Suspense fallback (8 skeleton-карточек)
      [id]/
        page.tsx          # Детальная страница школы + generateMetadata

i18n/
  routing.ts              # Конфиг локалей: ['pl', 'ru'], defaultLocale: 'pl', localePrefix: 'as-needed'
  request.ts              # Загрузка сообщений на сервере
middleware.ts             # next-intl middleware — определяет локаль из URL/заголовков

messages/
  pl.json                 # Польские переводы (~70 ключей)
  ru.json                 # Русские переводы (~70 ключей)

components/
  schools/
    filter-bar.tsx        # Панель фильтров — Client Component
    school-card.tsx       # Карточка школы — info_score badge, updated_at, pricing indicator
    school-grid.tsx       # Адаптивная сетка (1/2/3/4 колонки)
    school-card-skeleton.tsx
    pagination-button.tsx # Кнопка пагинации
    view-toggle.tsx       # Переключатель список/карта — Client Component
    school-map.tsx        # MapLibre GL JS карта с кластеризацией — Client Component
    school-detail-header.tsx    # Заголовок детальной страницы: название, бейджи, сайт
    school-detail-program.tsx   # Секция: этапы, языки, программа, методика
    school-detail-pricing.tsx   # Секция: таблица цен / simple pricing
    school-detail-contacts.tsx  # Секция: телефон, email, сайт
    school-detail-address.tsx   # Секция: адрес, интерактивная мини-карта
  ui/                     # shadcn/ui компоненты (badge, card, select, …) + checkbox-group.tsx

lib/
  supabase.ts             # Supabase client + getSchoolsAction + getFilterOptions
                          # + getSchoolDetailAction + getSchoolsForMapAction + getSchoolsForSitemap
  schema-config.ts        # SSOT всех полей, типы SchoolShortCard, SchoolDetail, FilterOptions
  glossary.ts             # lookupGlossary — термины для ValueTooltip
  utils.ts                # cn(), formatUpdatedAt(), isSafeUrl(), getScoreClassName()
```

---

## База данных (Supabase)

### Основные объекты

| Объект | Описание |
|--------|----------|
| `v_school_short_cards` | Вью для карточек в каталоге |
| `v_school_detail` | Вью для детальной страницы (полные данные) |
| `v_school_map` | Вью для маркеров карты (координаты + минимум полей) |
| `get_unique_filter_values()` | RPC — уникальные значения для dropdown-фильтров |

### Ключевые поля `v_school_short_cards`

| Поле | Тип | Описание |
|------|-----|----------|
| `numer_rspo` | number | Первичный ключ (реестр RSPO) |
| `nazwa` | string | Название школы |
| `wojewodztwo / powiat / gmina / miejscowosc` | string | Географический каскад |
| `adres` | string | Улица + номер дома |
| `wychowanie_przedszkolne` | boolean | Детский сад |
| `i_etap_edukacyjny` | boolean | Начальная школа (1–3 класс) |
| `ii_etap_edukacyjny` | boolean | Средняя школа (4–8 класс) |
| `instruction_languages` | string[] | Языки обучения |
| `curriculum` | string[] | Образовательная программа |
| `methodology` | string[] | Методика |
| `specialization` | string[] | Специализация |
| `school_category` | string[] | Тип школы |
| `total_annual_cost` | number\|null | Стоимость в год (PLN) |
| `pricing_score` | number | Полнота данных о цене (0–100) |
| `info_score` | number | Общая полнота данных (сумма всех скоров) |
| `updated_at` | string\|null | Дата последнего обновления записи |
| `website` | string\|null | Сайт школы |

**Сортировка по умолчанию:** `info_score DESC` → `nazwa ASC`
**Пагинация:** 12 школ на страницу

---

## Тесты

274+ тестов через Vitest + Testing Library (jsdom):

```bash
npm run test          # watch-режим
npm run test:coverage # однократный прогон с покрытием
```

Coverage исключает `components/ui/**` (shadcn) и `*.config.*`.

---

## Ключевые паттерны

### SSOT — schema-config.ts

`SCHOOL_SCHEMA` — единственный источник истины для всех полей и типов. Каждое поле содержит:
- `label` — относительный i18n-ключ (например `"nazwa.label"`), namespace `'fields'`; компоненты вызывают `t(field.label)` через `useTranslations('fields')`
- `type` — тип данных (`string`, `number`, `boolean`, `array`)
- `filterType` — тип фильтра (`text`, `select`, `multiselect`, `checkbox`, `range`, `null`)
- `source` — источник (`rspo` или `additional_data`)
- `nullable: true` — если поле nullable в базе (все поля кроме `numer_rspo` и `nazwa`)
- `geoLevel` — для каскадных гео-фильтров (1=воеводство, 2=повят, 3=гмина, 4=город)

Типы `SchoolShortCard` и `FilterOptions` генерируются из схемы автоматически — отдельного файла типов нет.

Хелперы: `getFieldsByFilterType()`, `getGeoFields()`, `getFilterKeys()`, `getFieldsByPosition()`.

### Каскадные гео-фильтры

При смене `wojewodztwo` → автоматически сбрасываются `powiat`, `gmina`, `miejscowosc`.
Логика в `filter-bar.tsx` — использует `geoLevel` из schema-config.

### Дебаунс поиска

400ms через `use-debounce` — для поля поиска по названию и диапазона цен.

---

## Data Pipeline (n8n на Render.com)

Автоматический сбор данных по одной школе:

```
Реестр RSPO (строка)
  → Google Search (находит сайт школы)
  → Jina.ai (читает страницу → Markdown)
  → AI-агент Gemma 27b (Extraction, промпт data_serch_promt)
  → score.js (оценивает полноту данных)
  → [если данных мало] AI-агент (Navigation) → ищет ссылки → повтор
  → Supabase (финальный результат)
```

**JSON-воркфлоу хранятся в Google Drive, папка `jsons`:**
- `AI_workflow`
- `data_serch_workflow`
- `data_serch_loop_workflow`
- `read_URL_workflow`
- `RSPO_workflow`
- `WEB_serch_loop_workflow`
