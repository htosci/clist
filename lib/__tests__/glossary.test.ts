import { describe, it, expect } from 'vitest'
import { toGlossaryKey, lookupGlossary, FIELD_GLOSSARY_NS } from '@/lib/glossary'
import ruMessages from '../../messages/ru.json'

// Приводим сообщения к типу, который ожидает lookupGlossary
const messages = ruMessages as unknown as Record<string, unknown>

// ============================================================
// toGlossaryKey — нормализация строк в i18n-ключи
// ============================================================
describe('toGlossaryKey', () => {
  // Базовые случаи: строки которые уже в нужном формате
  it('возвращает строку без изменений если она уже в нижнем регистре без спецсимволов', () => {
    expect(toGlossaryKey('pl')).toBe('pl')
  })

  it('возвращает строку без изменений если она состоит из букв и цифр', () => {
    expect(toGlossaryKey('montessori')).toBe('montessori')
  })

  // Регистр
  it('приводит к нижнему регистру', () => {
    expect(toGlossaryKey('Montessori')).toBe('montessori')
  })

  it('приводит к нижнему регистру полностью заглавную строку', () => {
    expect(toGlossaryKey('MEN')).toBe('men')
  })

  // Пробелы → подчёркивание
  it('заменяет одиночный пробел на подчёркивание', () => {
    expect(toGlossaryKey('Reggio Emilia')).toBe('reggio_emilia')
  })

  it('заменяет несколько пробелов подряд одним подчёркиванием', () => {
    expect(toGlossaryKey('a  b')).toBe('a_b')
  })

  // Дефис → подчёркивание
  it('заменяет дефис на подчёркивание', () => {
    expect(toGlossaryKey('project-based')).toBe('project_based')
  })

  it('заменяет несколько дефисов подряд одним подчёркиванием', () => {
    expect(toGlossaryKey('a--b')).toBe('a_b')
  })

  // Комбинация пробел и дефис
  it('обрабатывает смешанный пробел и дефис как одно подчёркивание', () => {
    expect(toGlossaryKey('a - b')).toBe('a_b')
  })

  // Спецсимволы удаляются
  it('удаляет точки', () => {
    expect(toGlossaryKey('a.b.c')).toBe('abc')
  })

  it('удаляет скобки и знаки препинания', () => {
    expect(toGlossaryKey('I.B. (diploma)')).toBe('ib_diploma')
  })

  it('оставляет цифры', () => {
    expect(toGlossaryKey('stage3')).toBe('stage3')
  })

  // Граничные случаи
  it('возвращает пустую строку для пустого ввода', () => {
    expect(toGlossaryKey('')).toBe('')
  })
})

// ============================================================
// lookupGlossary — поиск тултипа в messages
// ============================================================
describe('lookupGlossary', () => {
  // --- Успешные случаи ---

  it('возвращает строку тултипа для поля instruction_languages и значения "pl"', () => {
    // В messages/ru.json: glossary.languages.pl = "Польский"
    const result = lookupGlossary(messages, 'instruction_languages', 'pl')
    expect(result).toBe('Польский')
  })

  it('возвращает строку тултипа для поля methodology и значения "montessori"', () => {
    // В messages/ru.json: glossary.methodology.montessori = "Метод Монтессори: ..."
    const result = lookupGlossary(messages, 'methodology', 'montessori')
    expect(result).toContain('Монтессори')
  })

  it('нормализует значение перед поиском: "Reggio Emilia" найдёт ключ reggio_emilia', () => {
    // methodology значение "Reggio Emilia" должно нормализоваться в "reggio_emilia"
    const result = lookupGlossary(messages, 'methodology', 'Reggio Emilia')
    expect(result).toContain('Реджио Эмилиа')
  })

  it('возвращает тултип для поля school_category, значение "private"', () => {
    const result = lookupGlossary(messages, 'school_category', 'private')
    expect(result).toBeTruthy()
  })

  // --- Несуществующее поле (нет в FIELD_GLOSSARY_NS) ---

  it('возвращает undefined для поля которого нет в FIELD_GLOSSARY_NS', () => {
    // "nazwa" не входит в маппинг — для него нет тултипов
    const result = lookupGlossary(messages, 'nazwa', 'какое-то значение')
    expect(result).toBeUndefined()
  })

  it('возвращает undefined для пустого ключа поля', () => {
    const result = lookupGlossary(messages, '', 'pl')
    expect(result).toBeUndefined()
  })

  // --- Значение не найдено в секции ---

  it('возвращает undefined если значение не существует в секции glossary', () => {
    // instruction_languages существует в FIELD_GLOSSARY_NS,
    // но "klingon" не является языком в glossary.languages
    const result = lookupGlossary(messages, 'instruction_languages', 'klingon')
    expect(result).toBeUndefined()
  })

  // --- Отсутствующая секция glossary в сообщениях ---

  it('возвращает undefined если messages не содержит секции glossary', () => {
    // Передаём пустой объект сообщений вместо реальных
    const emptyMessages: Record<string, unknown> = {}
    const result = lookupGlossary(emptyMessages, 'instruction_languages', 'pl')
    expect(result).toBeUndefined()
  })

  it('возвращает undefined если glossary есть но нужного под-неймспейса нет', () => {
    // messages с glossary, но без секции 'languages'
    const messagesWithPartialGlossary: Record<string, unknown> = {
      glossary: {
        // секция 'languages' отсутствует намеренно — чтобы проверить ветку `if (!section)`
        methodology: { montessori: 'Монтессори' },
      },
    }
    const result = lookupGlossary(messagesWithPartialGlossary, 'instruction_languages', 'pl')
    expect(result).toBeUndefined()
  })
})

// ============================================================
// FIELD_GLOSSARY_NS — проверка самого маппинга (smoke-тест)
// ============================================================
describe('FIELD_GLOSSARY_NS', () => {
  it('содержит маппинг для instruction_languages', () => {
    expect(FIELD_GLOSSARY_NS['instruction_languages']).toBe('languages')
  })

  it('содержит маппинг для methodology', () => {
    expect(FIELD_GLOSSARY_NS['methodology']).toBe('methodology')
  })

  it('содержит маппинг для curriculum', () => {
    expect(FIELD_GLOSSARY_NS['curriculum']).toBe('curriculum')
  })

  it('содержит маппинг для school_category', () => {
    expect(FIELD_GLOSSARY_NS['school_category']).toBe('school_category')
  })

  it('содержит маппинг для specialization', () => {
    expect(FIELD_GLOSSARY_NS['specialization']).toBe('specialization')
  })
})
