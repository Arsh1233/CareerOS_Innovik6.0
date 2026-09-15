/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base URL of the CareerOS FastAPI backend, including the `/api/v1` prefix.
   * Example: `http://localhost:8000/api/v1`
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
