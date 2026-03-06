import { FilterOptions } from '@/lib/schema-config'

export const mockFilterOptions: FilterOptions = {
  geo_hierarchy: {
    'Mazowieckie': {
      'Warszawa': {
        'Warszawa': ['Warszawa', 'Ursynów'],
      },
    },
    'Małopolskie': {
      'Kraków': {
        'Kraków': ['Kraków'],
      },
    },
    'Śląskie': {
      'Katowice': {
        'Katowice': ['Katowice'],
      },
    },
  },
  school_category: ['private', 'international', 'bilingual'],
  instruction_languages: ['pl', 'en', 'de'],
  curriculum: ['MEN', 'IB', 'Cambridge'],
  methodology: ['Classic', 'Montessori'],
  specialization: ['Math', 'Linguistic'],
}
