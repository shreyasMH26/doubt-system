/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_APP_URL?: string;
  readonly VITE_ALLOWED_EMAIL_DOMAIN?: string;
  readonly VITE_AI_PROVIDER?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
