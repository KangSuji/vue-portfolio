/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** TMDB v4 Read Access Token */
  readonly VITE_TMDB_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
