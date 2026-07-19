#!/usr/bin/env node
/**
 * setup-supabase.mjs
 * Gera/atualiza o arquivo `.env` com as credenciais públicas do Supabase.
 *
 * Uso:
 *   1) Via variáveis de ambiente (recomendado em CI/Vercel):
 *      SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... SUPABASE_PROJECT_ID=... \
 *        node scripts/setup-supabase.mjs
 *
 *   2) Via flags CLI:
 *      node scripts/setup-supabase.mjs \
 *        --url=https://xxx.supabase.co \
 *        --key=eyJhbGciOi... \
 *        --project=xxx
 *
 *   3) Sem argumentos → usa os defaults deste projeto (Lotofácil Intelligence).
 *
 * Observação: apenas chaves PÚBLICAS (URL + anon/publishable key + project id).
 * NUNCA coloque service_role aqui — ela é secret e vive em Edge Functions.
 */
import { writeFileSync, existsSync, readFileSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULTS = {
  SUPABASE_URL: 'https://wevgcjgutpdazhqkhzhm.supabase.co',
  SUPABASE_PROJECT_ID: 'wevgcjgutpdazhqkhzhm',
  SUPABASE_PUBLISHABLE_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indldmdjamd1dHBkYXpocWtoemhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NTU4MTgsImV4cCI6MjA5NDQzMTgxOH0.QoPHF68n_-aU27f5HsmysQbMpuI4XxJ0HABE8Chjbtk',
};

const flags = Object.fromEntries(
  process.argv.slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, ...rest] = a.replace(/^--/, '').split('=');
      return [k.toLowerCase(), rest.join('=')];
    })
);

const url =
  flags.url || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULTS.SUPABASE_URL;
const key =
  flags.key ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  DEFAULTS.SUPABASE_PUBLISHABLE_KEY;
const projectId =
  flags.project ||
  process.env.SUPABASE_PROJECT_ID ||
  process.env.VITE_SUPABASE_PROJECT_ID ||
  DEFAULTS.SUPABASE_PROJECT_ID;

if (!url?.startsWith('http') || !key || !projectId) {
  console.error('❌ Credenciais inválidas. Forneça --url, --key e --project (ou variáveis de ambiente).');
  process.exit(1);
}

const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  copyFileSync(envPath, envPath + '.bak');
  console.log('📦 Backup criado em .env.bak');
}

const content =
  `VITE_SUPABASE_PROJECT_ID="${projectId}"\n` +
  `VITE_SUPABASE_PUBLISHABLE_KEY="${key}"\n` +
  `VITE_SUPABASE_URL="${url}"\n`;

writeFileSync(envPath, content, 'utf8');
console.log('✅ .env atualizado com sucesso:');
console.log(`   • VITE_SUPABASE_URL         = ${url}`);
console.log(`   • VITE_SUPABASE_PROJECT_ID  = ${projectId}`);
console.log(`   • VITE_SUPABASE_PUBLISHABLE_KEY = ${key.slice(0, 20)}…`);

// Verificação rápida de sanidade
try {
  const check = readFileSync(envPath, 'utf8');
  if (!check.includes('VITE_SUPABASE_URL=')) throw new Error('escrita falhou');
  console.log('🔒 Verificação de integridade: OK');
} catch (e) {
  console.error('⚠️  Falha ao verificar .env:', e.message);
  process.exit(1);
}
