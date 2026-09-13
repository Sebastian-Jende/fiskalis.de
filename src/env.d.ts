/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly GOOGLE_SHEET_ID: string;
  readonly PUBLIC_PLAUSIBLE_DOMAIN?: string;
  /** "true" while pitching from the unlisted pages.dev preview — forces noindex on every
   * page, drops the sitemap from robots.txt, and shows a preview banner. Unset (or anything
   * other than "true") for the real fiskalis.de launch. */
  readonly PUBLIC_PREVIEW_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
