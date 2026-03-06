import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSchool } from './fixtures/school.fixture'
import { mockFilterOptions } from './fixtures/filterOptions.fixture'

// --- Моки ---

// Хоистим mock-объекты, чтобы они были доступны внутри vi.mock()
const mockQuery = vi.hoisted(() => {
  const obj = {
    select: vi.fn(),
    ilike: vi.fn(),
    eq: vi.fn(),
    contains: vi.fn(),
    gte: vi.fn(),
    lte: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
  }
  // Настраиваем chain: каждый метод возвращает тот же объект
  obj.select.mockReturnValue(obj)
  obj.ilike.mockReturnValue(obj)
  obj.eq.mockReturnValue(obj)
  obj.contains.mockReturnValue(obj)
  obj.gte.mockReturnValue(obj)
  obj.lte.mockReturnValue(obj)
  obj.order.mockReturnValue(obj)
  obj.range.mockResolvedValue({ data: [], count: 0, error: null })
  return obj
})

const mockFrom = vi.hoisted(() => vi.fn())
const mockRpc = vi.hoisted(() => vi.fn())

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    rpc: mockRpc,
  })),
}))

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}))

// --- Helpers ---

function resetChain() {
  mockFrom.mockReturnValue(mockQuery)
  mockQuery.select.mockReturnValue(mockQuery)
  mockQuery.ilike.mockReturnValue(mockQuery)
  mockQuery.eq.mockReturnValue(mockQuery)
  mockQuery.contains.mockReturnValue(mockQuery)
  mockQuery.gte.mockReturnValue(mockQuery)
  mockQuery.lte.mockReturnValue(mockQuery)
  mockQuery.order.mockReturnValue(mockQuery)
  mockQuery.range.mockResolvedValue({ data: [], count: 0, error: null })
}

// --- Тесты ---

describe('getSchoolsAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetChain()
  })

  it('пагинация: page=1 вызывает range(0, 11)', async () => {
    const { getSchoolsAction } = await import('@/lib/supabase')
    await getSchoolsAction({ page: '1' })
    expect(mockQuery.range).toHaveBeenCalledWith(0, 11)
  })

  it('пагинация: page=3 вызывает range(24, 35)', async () => {
    const { getSchoolsAction } = await import('@/lib/supabase')
    await getSchoolsAction({ page: '3' })
    expect(mockQuery.range).toHaveBeenCalledWith(24, 35)
  })

  it('без page параметра по умолчанию page=1', async () => {
    const { getSchoolsAction } = await import('@/lib/supabase')
    await getSchoolsAction({})
    expect(mockQuery.range).toHaveBeenCalledWith(0, 11)
  })

  it('поиск: query="Warsaw" вызывает ilike', async () => {
    const { getSchoolsAction } = await import('@/lib/supabase')
    await getSchoolsAction({ query: 'Warsaw' })
    expect(mockQuery.ilike).toHaveBeenCalledWith('nazwa', '%Warsaw%')
  })

  it('пустой query не вызывает ilike', async () => {
    const { getSchoolsAction } = await import('@/lib/supabase')
    await getSchoolsAction({ query: '' })
    expect(mockQuery.ilike).not.toHaveBeenCalled()
  })

  it('гео: wojewodztwo вызывает eq', async () => {
    const { getSchoolsAction } = await import('@/lib/supabase')
    await getSchoolsAction({ wojewodztwo: 'Mazowieckie' })
    expect(mockQuery.eq).toHaveBeenCalledWith('wojewodztwo', 'Mazowieckie')
  })

  it('гео: значение "all" не вызывает eq', async () => {
    const { getSchoolsAction } = await import('@/lib/supabase')
    await getSchoolsAction({ wojewodztwo: 'all' })
    expect(mockQuery.eq).not.toHaveBeenCalledWith('wojewodztwo', expect.anything())
  })

  it('checkbox "true" вызывает eq с boolean true', async () => {
    const { getSchoolsAction } = await import('@/lib/supabase')
    await getSchoolsAction({ wychowanie_przedszkolne: 'true' })
    expect(mockQuery.eq).toHaveBeenCalledWith('wychowanie_przedszkolne', true)
  })

  it('checkbox "false" не вызывает eq', async () => {
    const { getSchoolsAction } = await import('@/lib/supabase')
    await getSchoolsAction({ wychowanie_przedszkolne: 'false' })
    expect(mockQuery.eq).not.toHaveBeenCalledWith('wychowanie_przedszkolne', expect.anything())
  })

  it('multiselect вызывает contains с массивом значений (AND логика)', async () => {
    const { getSchoolsAction } = await import('@/lib/supabase')
    await getSchoolsAction({ school_category: 'private,international' })
    expect(mockQuery.contains).toHaveBeenCalledWith('school_category', ['private', 'international'])
  })

  it('multiselect "all" не вызывает contains', async () => {
    const { getSchoolsAction } = await import('@/lib/supabase')
    await getSchoolsAction({ school_category: 'all' })
    expect(mockQuery.contains).not.toHaveBeenCalled()
  })

  it('range: min_fee вызывает gte', async () => {
    const { getSchoolsAction } = await import('@/lib/supabase')
    await getSchoolsAction({ min_fee: '10000' })
    expect(mockQuery.gte).toHaveBeenCalledWith('total_annual_cost', 10000)
  })

  it('range: max_fee вызывает lte', async () => {
    const { getSchoolsAction } = await import('@/lib/supabase')
    await getSchoolsAction({ max_fee: '50000' })
    expect(mockQuery.lte).toHaveBeenCalledWith('total_annual_cost', 50000)
  })

  it('сортировка по умолчанию: двойной order (info_score, nazwa)', async () => {
    const { getSchoolsAction } = await import('@/lib/supabase')
    await getSchoolsAction({})
    expect(mockQuery.order).toHaveBeenCalledWith('info_score', { ascending: false })
    expect(mockQuery.order).toHaveBeenCalledWith('nazwa', { ascending: true })
  })

  it('сортировка price_asc: order по total_annual_cost ascending', async () => {
    const { getSchoolsAction } = await import('@/lib/supabase')
    await getSchoolsAction({ sort: 'price_asc' })
    expect(mockQuery.order).toHaveBeenCalledWith('total_annual_cost', { ascending: true, nullsFirst: false })
  })

  it('сортировка price_desc: order по total_annual_cost descending', async () => {
    const { getSchoolsAction } = await import('@/lib/supabase')
    await getSchoolsAction({ sort: 'price_desc' })
    expect(mockQuery.order).toHaveBeenCalledWith('total_annual_cost', { ascending: false, nullsFirst: false })
  })

  it('возвращает правильную структуру ответа', async () => {
    mockQuery.range.mockResolvedValueOnce({ data: [mockSchool], count: 25, error: null })
    const { getSchoolsAction } = await import('@/lib/supabase')
    const result = await getSchoolsAction({ page: '2' })
    expect(result.data).toEqual([mockSchool])
    expect(result.count).toBe(25)
    expect(result.page).toBe(2)
    expect(result.totalPages).toBe(3) // Math.ceil(25/12) = 3
  })

  it('выбрасывает ошибку при ошибке Supabase', async () => {
    const error = new Error('DB error')
    mockQuery.range.mockResolvedValueOnce({ data: null, count: null, error })
    const { getSchoolsAction } = await import('@/lib/supabase')
    await expect(getSchoolsAction({})).rejects.toThrow('DB error')
  })
})

describe('getSchoolsForMapAction', () => {
  // Для map action цепочка НЕ заканчивается на range — нужен Thenable mockQuery
  let mapResult = { data: [] as unknown[], error: null as Error | null }

  beforeEach(() => {
    vi.clearAllMocks()
    resetChain()
    mapResult = { data: [], error: null }
    // Делаем mockQuery Thenable: await mockQuery вызовет mockQuery.then
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(mockQuery as any).then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve(mapResult).then(resolve)
  })

  afterEach(() => {
    // Убираем then чтобы не влиять на тесты getSchoolsAction (там range — последний)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (mockQuery as any).then
  })

  it('запрашивает v_school_map', async () => {
    const { getSchoolsForMapAction } = await import('@/lib/supabase')
    await getSchoolsForMapAction({})
    expect(mockFrom).toHaveBeenCalledWith('v_school_map')
  })

  it('применяет query-фильтр ilike', async () => {
    const { getSchoolsForMapAction } = await import('@/lib/supabase')
    await getSchoolsForMapAction({ query: 'Test' })
    expect(mockQuery.ilike).toHaveBeenCalledWith('nazwa', '%Test%')
  })

  it('применяет гео-фильтр eq', async () => {
    const { getSchoolsForMapAction } = await import('@/lib/supabase')
    await getSchoolsForMapAction({ miejscowosc: 'Warszawa' })
    expect(mockQuery.eq).toHaveBeenCalledWith('miejscowosc', 'Warszawa')
  })

  it('возвращает [] при ошибке Supabase', async () => {
    mapResult = { data: null as unknown as unknown[], error: new Error('fail') }
    const { getSchoolsForMapAction } = await import('@/lib/supabase')
    const result = await getSchoolsForMapAction({})
    expect(result).toEqual([])
  })

  it('возвращает данные при успехе', async () => {
    const marker = { numer_rspo: 1, nazwa: 'Test', lat: 52.0, lng: 21.0 }
    mapResult = { data: [marker], error: null }
    const { getSchoolsForMapAction } = await import('@/lib/supabase')
    const result = await getSchoolsForMapAction({})
    expect(result).toEqual([marker])
  })

  // Эти три теста проверяют ветки фильтрации, которые есть в getSchoolsForMapAction
  // но не были покрыты. При рефакторинге или баге в этих фильтрах
  // тесты поймают регрессию.

  it('применяет checkbox-фильтр eq с boolean true', async () => {
    const { getSchoolsForMapAction } = await import('@/lib/supabase')
    await getSchoolsForMapAction({ wychowanie_przedszkolne: 'true' })
    expect(mockQuery.eq).toHaveBeenCalledWith('wychowanie_przedszkolne', true)
  })

  it('checkbox "false" не вызывает eq', async () => {
    const { getSchoolsForMapAction } = await import('@/lib/supabase')
    await getSchoolsForMapAction({ wychowanie_przedszkolne: 'false' })
    expect(mockQuery.eq).not.toHaveBeenCalledWith('wychowanie_przedszkolne', expect.anything())
  })

  it('применяет multiselect-фильтр contains с массивом (AND логика)', async () => {
    const { getSchoolsForMapAction } = await import('@/lib/supabase')
    await getSchoolsForMapAction({ instruction_languages: 'pl,en' })
    expect(mockQuery.contains).toHaveBeenCalledWith('instruction_languages', ['pl', 'en'])
  })

  it('применяет range-фильтр min_fee через gte', async () => {
    const { getSchoolsForMapAction } = await import('@/lib/supabase')
    await getSchoolsForMapAction({ min_fee: '20000' })
    expect(mockQuery.gte).toHaveBeenCalledWith('total_annual_cost', 20000)
  })
})

describe('getFilterOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetChain()
  })

  it('успешно возвращает FilterOptions из RPC', async () => {
    mockRpc.mockResolvedValueOnce({ data: mockFilterOptions, error: null })
    const { getFilterOptions } = await import('@/lib/supabase')
    const result = await getFilterOptions()
    expect(result).toEqual(mockFilterOptions)
    expect(mockRpc).toHaveBeenCalledWith('get_unique_filter_values')
  })

  it('возвращает null при ошибке RPC', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: new Error('RPC fail') })
    const { getFilterOptions } = await import('@/lib/supabase')
    const result = await getFilterOptions()
    expect(result).toBeNull()
  })

  it('при null data возвращает null', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null })
    const { getFilterOptions } = await import('@/lib/supabase')
    const result = await getFilterOptions()
    expect(result).toBeNull()
  })

  it('заполняет отсутствующие поля значениями по умолчанию', async () => {
    mockRpc.mockResolvedValueOnce({
      data: { geo_hierarchy: null, school_category: ['private'] },
      error: null,
    })
    const { getFilterOptions } = await import('@/lib/supabase')
    const result = await getFilterOptions()
    expect(result?.geo_hierarchy).toEqual({})
    expect(result?.school_category).toEqual(['private'])
    expect(result?.instruction_languages).toEqual([])
  })
})
