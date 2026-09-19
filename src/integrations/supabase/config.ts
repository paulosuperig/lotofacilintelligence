/**
 * Configuração pública do Supabase.
 *
 * Os valores abaixo são públicos (URL + publishable/anon key) e servem como
 * fallback determinístico quando as variáveis de ambiente não estão presentes
 * no ambiente de build (ex.: deploy na Vercel sem env vars configuradas).
 * Nunca colocar chaves secretas (service_role) aqui.
 */
export const SUPABASE_URL_FALLBACK = "https://wevgcjgutpdazhqkhzhm.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY_FALLBACK =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indldmdjamd1dHBkYXpocWtoemhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NTU4MTgsImV4cCI6MjA5NDQzMTgxOH0.QoPHF68n_-aU27f5HsmysQbMpuI4XxJ0HABE8Chjbtk";
