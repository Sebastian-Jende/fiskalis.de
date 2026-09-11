export type Kategorie = 'steuerberater' | 'finanzberater' | 'buchhalter';

export type ListingTier = 'standard' | 'premium';
export type ProviderStatus = 'pending' | 'approved' | 'rejected' | 'archived';

export interface City {
  name: string;
  slug: string;
  bundesland: string | null;
  meta_beschreibung: string | null;
  /** Optional, redaktionell gepflegter Absatz für Einzigartigkeit ggü. reinen Template-Seiten. */
  intro_text: string | null;
}

export interface Specialization {
  name: string;
  slug: string;
  kategorie: Kategorie;
  meta_beschreibung: string | null;
  intro_text: string | null;
}

/** A real, moderated review submitted through the public review form. */
export interface Review {
  provider_slug: string;
  name: string;
  datum: string | null;
  bewertung_kommunikation: number | null;
  bewertung_fachwissen: number | null;
  bewertung_zufriedenheit: number | null;
  text: string;
  freigegeben: boolean;
}

export interface Provider {
  name: string;
  slug: string;
  kategorien: Kategorie[];

  tagline: string | null;
  ueber_uns: string | null;

  strasse: string | null;
  plz: string | null;
  ort: City | null;
  bundesweit_remote: boolean;
  latitude: number | null;
  longitude: number | null;

  telefon: string | null;
  email: string | null;
  website_url: string | null;

  leistungen: string[];
  branchen: string[];
  spezialisierungen: Specialization[];

  preismodell: string | null;
  min_mandatsgroesse: string | null;
  team_groesse: number | null;
  gegruendet: number | null;

  kammer_id: string | null;
  verifiziert_am: string | null;

  logo_url: string | null;
  listing_tier: ListingTier;
  status: ProviderStatus;

  reviews: Review[];
}

/** Derived at build time from a provider's approved reviews — never stored in the Sheet. */
export interface RatingSummary {
  count: number;
  average: number | null;
  averageKommunikation: number | null;
  averageFachwissen: number | null;
  averageZufriedenheit: number | null;
}

export interface FaqEntry {
  seite: string;
  frage: string;
  antwort: string;
  reihenfolge: number;
  status: 'draft' | 'published';
}

export interface CategoryCityCombo {
  kategorie: Kategorie;
  city: City;
  providers: Provider[];
}

export interface CategorySpecializationCombo {
  kategorie: Kategorie;
  specialization: Specialization;
  providers: Provider[];
}
