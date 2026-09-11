/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly GOOGLE_SHEET_ID: string;
  readonly PUBLIC_PLAUSIBLE_DOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
