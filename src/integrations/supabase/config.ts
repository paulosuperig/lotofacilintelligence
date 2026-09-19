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
  undefined;
