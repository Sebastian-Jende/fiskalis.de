import { fetchSheetTab, parseBoolean, parseOptionalNumber, splitList } from './sheets';
import { slugify } from './slugify';
import { isKategorie } from './categoryLabels';
import type {
  City,
  CategoryCityCombo,
  CategorySpecializationCombo,
  FaqEntry,
  Kategorie,
  ListingTier,
  Provider,
  ProviderStatus,
  RatingSummary,
  Review,
  Specialization,
} from './types';

/** Doorway-page guardrail: a Kategorie×Stadt or Kategorie×Spezialisierung page only
 * gets generated once it can show at least this many providers. Below that, Google
 * has historically treated thin programmatic pages as doorway pages (see e.g. a
 * 45k-page legal directory that lost 96% of its traffic to a manual action) — we'd
 * rather have a route not exist yet than exist with nothing real to show. */
const MIN_PROVIDERS_PER_COMBO = 3;

const TIER_SORT_WEIGHT: Record<ListingTier, number> = { premium: 0, standard: 1 };

function ratingOf(review: Review): number | null {
  const values = [
    review.bewertung_kommunikation,
    review.bewertung_fachwissen,
    review.bewertung_zufriedenheit,
  ].filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function average(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((sum, v) => sum + v, 0) / nums.length) * 10) / 10;
}

/** Ratings are always derived live from approved reviews — never stored/cached as a
 * pre-aggregated number in the Sheet, so nobody can hand-edit a rating (matches
 * Google's requirement that aggregate ratings come directly from real user reviews,
 * not an editor-compiled figure). */
export function getRatingSummary(provider: Provider): RatingSummary {
  const approved = provider.reviews.filter((r) => r.freigegeben);
  return {
    count: approved.length,
    average: average(approved.map(ratingOf)),
    averageKommunikation: average(approved.map((r) => r.bewertung_kommunikation)),
    averageFachwissen: average(approved.map((r) => r.bewertung_fachwissen)),
    averageZufriedenheit: average(approved.map((r) => r.bewertung_zufriedenheit)),
  };
}

function sortProviders(a: Provider, b: Provider) {
  const statusWeight = (p: Provider) => (p.status === 'approved' ? 0 : 1);
  const statusDiff = statusWeight(a) - statusWeight(b);
  if (statusDiff !== 0) return statusDiff;

  const ratingA = getRatingSummary(a).average ?? -1;
  const ratingB = getRatingSummary(b).average ?? -1;
  if (ratingA !== ratingB) return ratingB - ratingA;

  return TIER_SORT_WEIGHT[a.listing_tier] - TIER_SORT_WEIGHT[b.listing_tier];
}

function parseCityRow(row: Record<string, string>): City {
  return {
    name: row.name,
    slug: row.slug || slugify(row.name),
    bundesland: row.bundesland || null,
    meta_beschreibung: row.meta_beschreibung || null,
    intro_text: row.intro_text || null,
  };
}

function parseSpecializationRow(row: Record<string, string>): Specialization | null {
  if (!isKategorie(row.kategorie)) return null;
  return {
    name: row.name,
    slug: row.slug || slugify(row.name),
    kategorie: row.kategorie,
    meta_beschreibung: row.meta_beschreibung || null,
    intro_text: row.intro_text || null,
  };
}

function parseReviewRow(row: Record<string, string>): Review {
  return {
    provider_slug: row.provider_slug,
    name: row.name || 'Anonym',
    datum: row.datum || null,
    bewertung_kommunikation: parseOptionalNumber(row.bewertung_kommunikation),
    bewertung_fachwissen: parseOptionalNumber(row.bewertung_fachwissen),
    bewertung_zufriedenheit: parseOptionalNumber(row.bewertung_zufriedenheit),
    text: row.text || '',
    freigegeben: parseBoolean(row.freigegeben),
  };
}

function parseProviderRow(
  row: Record<string, string>,
  citiesBySlug: Map<string, City>,
  specsByKey: Map<string, Specialization>,
  reviewsBySlug: Map<string, Review[]>
): Provider | null {
  const kategorien = splitList(row.kategorien).filter(isKategorie);
  if (kategorien.length === 0) return null;

  const slug = row.slug || slugify(row.name);
  const spezialisierungen = splitList(row.spezialisierungen)
    .map((s) => specsByKey.get(`${kategorien[0]}::${s}`))
    .filter((s): s is Specialization => Boolean(s));

  return {
    name: row.name,
    slug,
    kategorien,

    tagline: row.tagline || null,
    ueber_uns: row.ueber_uns || null,

    strasse: row.strasse || null,
    plz: row.plz || null,
    ort: row.ort_slug ? (citiesBySlug.get(row.ort_slug) ?? null) : null,
    bundesweit_remote: parseBoolean(row.bundesweit_remote),
    latitude: parseOptionalNumber(row.latitude),
    longitude: parseOptionalNumber(row.longitude),

    telefon: row.telefon || null,
    email: row.email || null,
    website_url: row.website_url || null,

    leistungen: splitList(row.leistungen),
    branchen: splitList(row.branchen),
    spezialisierungen,

    preismodell: row.preismodell || null,
    min_mandatsgroesse: row.min_mandatsgroesse || null,
    team_groesse: parseOptionalNumber(row.team_groesse),
    gegruendet: parseOptionalNumber(row.gegruendet),

    kammer_id: row.kammer_id || null,
    verifiziert_am: row.verifiziert_am || null,

    logo_url: row.logo_url || null,
    listing_tier: (row.listing_tier || 'standard') as ListingTier,
    status: (row.status || 'pending') as ProviderStatus,

    reviews: reviewsBySlug.get(slug) ?? [],
  };
}

function parseFaqRow(row: Record<string, string>): FaqEntry {
  return {
    seite: row.seite || 'home',
    frage: row.frage,
    antwort: row.antwort,
    reihenfolge: parseOptionalNumber(row.reihenfolge) ?? 0,
    status: (row.status || 'draft') as FaqEntry['status'],
  };
}

let cachedCities: City[] | null = null;
let cachedSpecializations: Specialization[] | null = null;
let cachedProviders: Provider[] | null = null;
let cachedFaqEntries: FaqEntry[] | null = null;

export async function getAllCities(): Promise<City[]> {
  if (!cachedCities) {
    const rows = await fetchSheetTab('Staedte');
    cachedCities = rows.map(parseCityRow);
  }
  return cachedCities;
}

export async function getAllSpecializations(): Promise<Specialization[]> {
  if (!cachedSpecializations) {
    const rows = await fetchSheetTab('Spezialisierungen');
    cachedSpecializations = rows
      .map(parseSpecializationRow)
      .filter((s): s is Specialization => s !== null);
  }
  return cachedSpecializations;
}

/**
 * All publicly listed providers — both vetted (`approved`) and not-yet-contacted
 * (`pending`) entries, so the directory can grow ahead of outreach, same pattern as
 * Uhrenverzeichnis.de. Only `approved` providers get the "Geprüft"-badge (see
 * categoryLabels-adjacent verification check in components). Cached per build.
 */
export async function getListedProviders(): Promise<Provider[]> {
  if (cachedProviders) return cachedProviders;

  const [providerRows, reviewRows, cities, specializations] = await Promise.all([
    fetchSheetTab('Anbieter'),
    fetchSheetTab('Bewertungen'),
    getAllCities(),
    getAllSpecializations(),
  ]);

  const citiesBySlug = new Map(cities.map((c) => [c.slug, c]));
  const specsByKey = new Map(specializations.map((s) => [`${s.kategorie}::${s.slug}`, s]));

  const reviewsBySlug = new Map<string, Review[]>();
  for (const row of reviewRows) {
    const review = parseReviewRow(row);
    const list = reviewsBySlug.get(review.provider_slug) ?? [];
    list.push(review);
    reviewsBySlug.set(review.provider_slug, list);
  }

  cachedProviders = providerRows
    .map((row) => parseProviderRow(row, citiesBySlug, specsByKey, reviewsBySlug))
    .filter((p): p is Provider => p !== null)
    .filter((p) => p.status === 'approved' || p.status === 'pending')
    .sort(sortProviders);

  return cachedProviders;
}

/** A provider's first listed Kategorie is where its profile page canonically lives —
 * keeps a multi-category provider (e.g. Buchhalter + Steuerberater) from generating
 * two near-identical profile pages that would compete with each other in search. */
export function primaryKategorie(provider: Provider): Kategorie {
  return provider.kategorien[0];
}

export async function getProvidersByCategory(kategorie: Kategorie): Promise<Provider[]> {
  const providers = await getListedProviders();
  return providers.filter((p) => p.kategorien.includes(kategorie));
}

export async function getProviderByCategoryAndSlug(
  kategorie: Kategorie,
  slug: string
): Promise<Provider | null> {
  const providers = await getListedProviders();
  return (
    providers.find((p) => primaryKategorie(p) === kategorie && p.slug === slug) ?? null
  );
}

export async function getProvidersByCategoryAndCity(
  kategorie: Kategorie,
  citySlug: string
): Promise<Provider[]> {
  const providers = await getProvidersByCategory(kategorie);
  return providers.filter((p) => p.ort?.slug === citySlug);
}

export async function getProvidersByCategoryAndSpecialization(
  kategorie: Kategorie,
  specSlug: string
): Promise<Provider[]> {
  const providers = await getProvidersByCategory(kategorie);
  // A provider's `spezialisierungen` are resolved once against its *primary* category's
  // specialization set (see parseProviderRow) — so a provider listed here only via a
  // secondary category (e.g. primarily "buchhalter" but also tagged "steuerberater") can
  // still carry specialization objects whose own `.kategorie` doesn't match `kategorie`.
  // Filter on that field explicitly rather than trusting membership alone, or a
  // Buchhalter-scoped specialization could leak into a Steuerberater combo page.
  return providers.filter((p) =>
    p.spezialisierungen.some((s) => s.slug === specSlug && s.kategorie === kategorie)
  );
}

/** Cities with enough listed providers *in this category* to justify their own
 * indexable page — see MIN_PROVIDERS_PER_COMBO. */
export async function getCityCombosForCategory(kategorie: Kategorie): Promise<CategoryCityCombo[]> {
  const providers = await getProvidersByCategory(kategorie);
  const byCitySlug = new Map<string, CategoryCityCombo>();

  for (const provider of providers) {
    if (!provider.ort) continue;
    const existing = byCitySlug.get(provider.ort.slug);
    if (existing) {
      existing.providers.push(provider);
    } else {
      byCitySlug.set(provider.ort.slug, { kategorie, city: provider.ort, providers: [provider] });
    }
  }

  return [...byCitySlug.values()].filter((combo) => combo.providers.length >= MIN_PROVIDERS_PER_COMBO);
}

/** Specializations with enough listed providers *in this category* to justify their
 * own indexable page — see MIN_PROVIDERS_PER_COMBO. */
export async function getSpecializationCombosForCategory(
  kategorie: Kategorie
): Promise<CategorySpecializationCombo[]> {
  const providers = await getProvidersByCategory(kategorie);
  const bySlug = new Map<string, CategorySpecializationCombo>();

  for (const provider of providers) {
    // See the matching comment in getProvidersByCategoryAndSpecialization: a provider
    // present here only via a secondary category can carry specialization objects scoped
    // to its *primary* category, which must not bleed into this category's combos.
    for (const spec of provider.spezialisierungen.filter((s) => s.kategorie === kategorie)) {
      const existing = bySlug.get(spec.slug);
      if (existing) {
        existing.providers.push(provider);
      } else {
        bySlug.set(spec.slug, { kategorie, specialization: spec, providers: [provider] });
      }
    }
  }

  return [...bySlug.values()].filter((combo) => combo.providers.length >= MIN_PROVIDERS_PER_COMBO);
}

/**
 * Guards the shared `/{kategorie}/` slug namespace: within one category, city slugs,
 * specialization slugs and provider slugs must never collide, or `[...slug].astro`
 * cannot disambiguate routes. Call once during route generation and let it throw to
 * fail the build loudly rather than silently shadow a route.
 */
export async function assertSlugNamespaceIsUnique(kategorie: Kategorie): Promise<void> {
  const [cityCombos, specCombos, providers] = await Promise.all([
    getCityCombosForCategory(kategorie),
    getSpecializationCombosForCategory(kategorie),
    getProvidersByCategory(kategorie),
  ]);

  const seen = new Map<string, string>();
  const record = (slug: string, kind: string) => {
    const existingKind = seen.get(slug);
    if (existingKind && existingKind !== kind) {
      throw new Error(
        `Slug collision in /${kategorie}/ namespace: "${slug}" is used by both a ${existingKind} and a ${kind}. ` +
          'Rename one of them in the Sheet before building.'
      );
    }
    seen.set(slug, kind);
  };

  cityCombos.forEach((c) => record(c.city.slug, 'Stadt'));
  specCombos.forEach((s) => record(s.specialization.slug, 'Spezialisierung'));
  providers
    .filter((p) => primaryKategorie(p) === kategorie)
    .forEach((p) => record(p.slug, 'Anbieter'));
}

export async function getFaqEntries(): Promise<FaqEntry[]> {
  if (!cachedFaqEntries) {
    const rows = await fetchSheetTab('FAQ');
    cachedFaqEntries = rows
      .map(parseFaqRow)
      .filter((f) => f.status === 'published')
      .sort((a, b) => a.reihenfolge - b.reihenfolge);
  }
  return cachedFaqEntries;
}

export async function getFaqEntriesForPage(seite: string): Promise<FaqEntry[]> {
  const all = await getFaqEntries();
  return all.filter((f) => f.seite === seite);
}
