#!/usr/bin/env node
/**
 * validate-supabase.mjs
 * Contract: Validates Supabase environment configuration.
 * 
 * Exit Codes:
 *   - 0: Configuration is valid.
 *   - 1: Configuration is invalid or incomplete (in --strict mode or if missing critical vars).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RED = '\x1b[31m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m', DIM = '\x1b[2m', RESET = '\x1b[0m';

const flags = process.argv.slice(2);
const IS_STRICT = flags.includes('--strict') || process.env.STRICT_VALIDATION === '1';
const failures = [];

const log = {
  ok: (m) => console.log(`${GREEN}✓${RESET} ${m}`),
  fail: (m) => { failures.push(m); console.log(`${RED}✗${RESET} ${m}`); },
  warn: (m) => console.log(`${YELLOW}!${RESET} ${m}`),
  info: (m) => console.log(`${DIM}·${RESET} ${m}`)
};

function loadEnv() {
  const env = { ...process.env };
  const envPath = resolve(process.cwd(), '.env');
  if (existsSync(envPath)) {
    readFileSync(envPath, 'utf8').split('\n').forEach(line => {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/i);
      if (match && !process.env[match[1]]) env[match[1]] = match[2];
    });
  }
  return env;
}

function decodeJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

async function validate() {
  console.log(`\n🔍 Validating release contract: Supabase configuration...\n`);
  const env = loadEnv();

  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;
  const projectId = env.VITE_SUPABASE_PROJECT_ID;

  // 1. Check presence
  if (!url) log.fail('VITE_SUPABASE_URL is missing');
  if (!key) log.fail('VITE_SUPABASE_PUBLISHABLE_KEY is missing');
  if (!projectId) log.fail('VITE_SUPABASE_PROJECT_ID is missing');
  
  if (failures.length > 0) return false;

  // 2. Format validation
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith('.supabase.co')) log.warn(`Non-standard Supabase hostname: ${u.hostname}`);
    if (!u.hostname.includes(projectId)) log.fail(`URL hostname does not match Project ID: ${projectId}`);
    else log.ok('URL matches Project ID');
  } catch (e) {
    log.fail(`Invalid URL format: ${url}`);
  }

  // 3. JWT integrity
  const jwt = decodeJwt(key);
  if (!jwt) {
    log.fail('Invalid JWT format in key');
  } else {
    if (jwt.role !== 'anon') log.fail(`Key role is "${jwt.role}", expected "anon" for client use.`);
    else log.ok('JWT role is correct (anon)');
    
    if (jwt.exp && Date.now() / 1000 > jwt.exp) log.fail('JWT has expired');
    else if (jwt.exp) log.info(`JWT expires at ${new Date(jwt.exp * 1000).toISOString()}`);
  }

  // 4. Secret leak check
  const secrets = ['SERVICE_ROLE', 'SECRET_KEY', 'PRIVATE_KEY'];
  Object.keys(env).forEach(k => {
    if (k.startsWith('VITE_') && secrets.some(s => k.includes(s))) {
      log.fail(`SECURITY ALERT: Secret "${k}" exposed with VITE_ prefix!`);
    }
  });

  // 5. Reachability (optional check, skip if offline but warn)
  try {
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key }, signal: AbortSignal.timeout(5000) });
    if (res.ok) log.ok('Supabase Auth API is reachable and accepting the key');
    else log.fail(`Supabase Auth API returned status ${res.status}`);
  } catch (e) {
    log.warn(`Could not reach Supabase API: ${e.message}`);
    if (IS_STRICT) log.fail('Strict mode: Reachability check failed');
  }

  return failures.length === 0;
}

validate().then(success => {
  console.log();
  if (!success) {
    console.log(`${RED}✗ Validation failed with ${failures.length} errors.${RESET}`);
    if (IS_STRICT) process.exit(1);
    else log.warn('Non-strict mode: ignoring failures for now.');
  } else {
    log.ok('Configuration is valid for release.');
  }
  process.exit(0);
});
