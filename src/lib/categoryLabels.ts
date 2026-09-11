import type { Kategorie } from './types';

interface CategoryLabel {
  slug: Kategorie;
  singular: string;
  plural: string;
  /** Für "Ich suche einen/eine…"-Selector und Title-Tags. */
  akkusativ: string;
  heroClaim: string;
  metaDescription: string;
}

export const CATEGORY_LABELS: Record<Kategorie, CategoryLabel> = {
  steuerberater: {
    slug: 'steuerberater',
    singular: 'Steuerberater',
    plural: 'Steuerberater',
    akkusativ: 'einen Steuerberater',
    heroClaim: 'Steuererklärung, Buchführung und Steuerstrategie — von zugelassenen Kanzleien.',
    metaDescription:
      'Geprüfte Steuerberater in Deutschland finden: nach Ort, Spezialisierung und echten Mandanten-Bewertungen filtern.',
  },
  finanzberater: {
    slug: 'finanzberater',
    singular: 'Finanzberater',
    plural: 'Finanzberater',
    akkusativ: 'einen Finanzberater',
    heroClaim: 'Vermögensaufbau, Altersvorsorge und Honorarberatung — unabhängig geprüft.',
    metaDescription:
      'Geprüfte Finanzberater und Honorarberater in Deutschland finden: nach Ort, Spezialisierung und echten Bewertungen filtern.',
  },
  buchhalter: {
    slug: 'buchhalter',
    singular: 'Buchhalter',
    plural: 'Buchhalter',
    akkusativ: 'einen Buchhalter',
    heroClaim: 'Laufende Buchführung und Kontierung — zuverlässig und ortsunabhängig.',
    metaDescription:
      'Geprüfte Buchhalter und Bilanzbuchhalter in Deutschland finden: nach Ort, Spezialisierung und echten Bewertungen filtern.',
  },
};

export const ALL_CATEGORIES: Kategorie[] = ['steuerberater', 'finanzberater', 'buchhalter'];

export function isKategorie(value: string): value is Kategorie {
  return (ALL_CATEGORIES as string[]).includes(value);
}
