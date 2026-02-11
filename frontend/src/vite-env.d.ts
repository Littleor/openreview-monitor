/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OFFICIAL_API_BASE_URL?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_ANALYTICS_SRC?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
