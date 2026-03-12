/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_LOCALE?: "de" | "en";
  readonly VITE_FALLBACK_LOCALE?: "de" | "en";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
