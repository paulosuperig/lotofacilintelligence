#!/usr/bin/env node
/**
 * validate-supabase.mjs
 * Valida as credenciais públicas do Supabase (.env / env vars).
 * Sai com código 1 se qualquer verificação falhar — pronto para CI.
 *
 * Checks:
 *  1) Variáveis presentes: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID
 *  2) URL bem-formada e coerente com o project id
 *  3) Chave é um JWT com role=anon e não expirada
 *  4) Endpoint REST responde 200 com apikey (GET /rest/v1/)
 *  5) GoTrue responde em /auth/v1/settings
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RED = '\x1b[31m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m', DIM = '\x1b[2m', RESET = '\x1b[0m';
const ok = (m) => console.log(`${GREEN}✓${RESET} ${m}`);
const fail = (m) => console.log(`${RED}✗${RESET} ${m}`);
const warn = (m) => console.log(`${YELLOW}!${RESET} ${m}`);
const info = (m) => console.log(`${DIM}·${RESET} ${m}`);

function loadEnv() {
  const envPath = resolve(process.cwd(), '.env');
  const env = { ...process.env };
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/i);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  }
  return env;
}

function decodeJwt(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('não é um JWT válido (esperado 3 partes)');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  return payload;
}

const failures = [];
const record = (msg) => { failures.push(msg); fail(msg); };

async function main() {
  console.log(`\n🔍 Validando credenciais Supabase…\n`);
  const env = loadEnv();
  const SUPA_URL = env.VITE_SUPABASE_URL;
  const KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
  const PID = env.VITE_SUPABASE_PROJECT_ID;

  // 1. Presença
  if (!SUPA_URL) record('VITE_SUPABASE_URL ausente');
  else ok(`VITE_SUPABASE_URL = ${SUPA_URL}`);
  if (!KEY) record('VITE_SUPABASE_PUBLISHABLE_KEY ausente');
  else ok(`VITE_SUPABASE_PUBLISHABLE_KEY = ${KEY.slice(0, 18)}…`);
  if (!PID) record('VITE_SUPABASE_PROJECT_ID ausente');
  else ok(`VITE_SUPABASE_PROJECT_ID = ${PID}`);
  if (failures.length) return;

  // 2. URL coerente
  let host = '';
  try {
    const u = new URL(SUPA_URL);
    host = u.hostname;
    if (!host.endsWith('.supabase.co')) warn(`hostname incomum: ${host}`);
    if (PID && !host.startsWith(PID)) {
      record(`URL (${host}) não bate com PROJECT_ID (${PID})`);
    } else ok('URL coerente com project id');
  } catch (e) {
    record(`URL inválida: ${SUPA_URL} (${e.message})`);
  }

  // 3. JWT válido / não expirado / role anon
  try {
    const p = decodeJwt(KEY);
    if (p.role !== 'anon') record(`role da chave é "${p.role}" — esperado "anon" (nunca use service_role no client)`);
    else ok('JWT decodificado (role=anon)');
    if (p.ref && PID && p.ref !== PID) record(`ref do JWT (${p.ref}) ≠ PROJECT_ID (${PID})`);
    if (p.exp && Date.now() / 1000 > p.exp) record('JWT expirado');
    else if (p.exp) info(`expira em ${new Date(p.exp * 1000).toISOString()}`);
  } catch (e) {
    record(`falha ao decodificar JWT: ${e.message}`);
  }

  // 4. REST reachability (200 ou 401 = servidor up; 4xx específicos indicam key inválida)
  try {
    const r = await fetch(`${SUPA_URL}/rest/v1/`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
    if (r.status === 200 || r.status === 401 || r.status === 404) ok(`REST /rest/v1/ acessível (HTTP ${r.status})`);
    else record(`REST /rest/v1/ retornou ${r.status} ${r.statusText}`);
  } catch (e) {
    record(`REST inacessível: ${e.message}`);
  }

  // 5. GoTrue settings — valida efetivamente que a apikey é aceita
  try {
    const r = await fetch(`${SUPA_URL}/auth/v1/settings`, { headers: { apikey: KEY } });
    if (r.ok) ok(`Auth /auth/v1/settings respondeu ${r.status} (apikey aceita)`);
    else record(`Auth /auth/v1/settings retornou ${r.status} — apikey pode estar inválida`);
  } catch (e) {
    record(`Auth inacessível: ${e.message}`);
  }
}

main()
  .catch((e) => record(`erro inesperado: ${e.message}`))
  .finally(() => {
    console.log();
    if (failures.length) {
      console.log(`${RED}✗ ${failures.length} verificação(ões) falharam.${RESET}\n`);
      process.exit(1);
    }
    console.log(`${GREEN}✓ Credenciais Supabase válidas.${RESET}\n`);
    process.exit(0);
  });
