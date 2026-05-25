#!/usr/bin/env npx tsx
/**
 * Merge duplicate Pipedrive organizations grouped by orgnr.
 *
 *   npx tsx scripts/merge-org-duplicates.ts                   # dry-run, writes merge-plan.csv
 *   npx tsx scripts/merge-org-duplicates.ts --confirm         # executes merges, writes backup + log
 *   npx tsx scripts/merge-org-duplicates.ts --confirm --max 5 # cap for safe trial
 *
 * Auth: PIPEDRIVE_API_TOKEN env var.
 */

import axios, { AxiosError } from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
if (!API_TOKEN) {
  console.error('Missing PIPEDRIVE_API_TOKEN');
  process.exit(1);
}

const BASE = 'https://api.pipedrive.com/v1';
const OUT_DIR = path.join(process.cwd(), 'scripts', 'out');
fs.mkdirSync(OUT_DIR, { recursive: true });

const args = process.argv.slice(2);
const CONFIRM = args.includes('--confirm');
const MAX = (() => {
  const i = args.indexOf('--max');
  return i >= 0 ? parseInt(args[i + 1], 10) : Infinity;
})();

const ORGNR_FIELD = '1279e90f5f7b21897c051cd6e6b7a98fff50e3d2';

type Org = {
  id: number;
  name: string;
  owner_name?: string;
  add_time?: string;
  update_time?: string;
  open_deals_count?: number;
  closed_deals_count?: number;
  won_deals_count?: number;
  lost_deals_count?: number;
  people_count?: number;
  activities_count?: number;
  address?: string;
  [k: string]: unknown;
};

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function normOrgnr(s: unknown): string {
  if (s == null) return '';
  const digits = String(s).replace(/\D/g, '');
  if (digits.length !== 10) return '';
  // Luhn mod 10
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let d = parseInt(digits[i], 10);
    if (i % 2 === 0) d *= 2;
    if (d > 9) d -= 9;
    sum += d;
  }
  return sum % 10 === 0 ? digits : '';
}

async function fetchAllOrgs(): Promise<Org[]> {
  const all: Org[] = [];
  let start = 0;
  const limit = 500;
  while (true) {
    const res = await axios.get(`${BASE}/organizations`, {
      params: { api_token: API_TOKEN, start, limit },
    });
    const data = res.data?.data ?? [];
    all.push(...data);
    process.stderr.write(`Fetched ${all.length}\r`);
    if (!res.data?.additional_data?.pagination?.more_items_in_collection) break;
    start += limit;
  }
  process.stderr.write('\n');
  return all;
}

function score(o: Org): number {
  let s = 0;
  s += (Number(o.won_deals_count) || 0) * 100;
  s += (Number(o.open_deals_count) || 0) * 50;
  s += (Number(o.closed_deals_count) || 0) * 5;
  s += (Number(o.lost_deals_count) || 0) * 5;
  s += (Number(o.people_count) || 0) * 10;
  s += (Number(o.activities_count) || 0) * 1;
  if (o.address) s += 5;
  if ((o as any)['80dd287a601be2f4e526e433155004a32f1d61b2']) s += 5; // sni
  if (o.update_time) {
    const days = (Date.now() - new Date(o.update_time).getTime()) / 86400000;
    s += Math.max(0, 20 - days / 30); // recent = +20, fades over ~600 days
  }
  return s;
}

function pickMaster(group: Org[]): { master: Org; losers: Org[] } {
  const sorted = [...group].sort((a, b) => {
    const ds = score(b) - score(a);
    if (ds !== 0) return ds;
    return (new Date(a.add_time || 0).getTime()) - (new Date(b.add_time || 0).getTime());
  });
  return { master: sorted[0], losers: sorted.slice(1) };
}

type PlanRow = {
  orgnr: string;
  master_id: number;
  master_name: string;
  master_score: number;
  loser_ids: string;
  loser_names: string;
  owners: string;
  total_won: number;
  total_open: number;
  total_people: number;
  flags: string;
  action: 'auto' | 'review';
};

function planMerges(orgs: Org[]): PlanRow[] {
  const groups = new Map<string, Org[]>();
  for (const o of orgs) {
    const k = normOrgnr((o as any)[ORGNR_FIELD]);
    if (!k) continue;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(o);
  }

  const plan: PlanRow[] = [];
  for (const [orgnr, group] of groups) {
    if (group.length < 2) continue;

    const { master, losers } = pickMaster(group);
    const owners = new Set(group.map(g => g.owner_name).filter(Boolean));
    const wonCount = group.filter(g => (Number(g.won_deals_count) || 0) > 0).length;

    const flags: string[] = [];
    if (owners.size > 1) flags.push('multi-owner');
    if (wonCount > 1) flags.push('multi-won-deals');

    plan.push({
      orgnr,
      master_id: master.id,
      master_name: master.name,
      master_score: Math.round(score(master) * 10) / 10,
      loser_ids: losers.map(l => l.id).join(';'),
      loser_names: losers.map(l => l.name).join(' | '),
      owners: [...owners].join(';'),
      total_won: group.reduce((a, g) => a + (Number(g.won_deals_count) || 0), 0),
      total_open: group.reduce((a, g) => a + (Number(g.open_deals_count) || 0), 0),
      total_people: group.reduce((a, g) => a + (Number(g.people_count) || 0), 0),
      flags: flags.join(';'),
      action: flags.length === 0 ? 'auto' : 'review',
    });
  }

  return plan.sort((a, b) => b.master_score - a.master_score);
}

function writeCsv(rows: PlanRow[], file: string) {
  const cols: (keyof PlanRow)[] = [
    'action','orgnr','master_id','master_name','master_score',
    'loser_ids','loser_names','owners','total_won','total_open','total_people','flags',
  ];
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.join(',')];
  for (const r of rows) lines.push(cols.map(c => esc(r[c])).join(','));
  fs.writeFileSync(file, lines.join('\n') + '\n');
}

async function getOrg(id: number): Promise<Org | null> {
  try {
    const r = await axios.get(`${BASE}/organizations/${id}`, { params: { api_token: API_TOKEN } });
    return r.data?.data ?? null;
  } catch (e) {
    return null;
  }
}

async function mergeOrg(masterId: number, loserId: number): Promise<{ ok: true } | { ok: false; error: string }> {
  let attempt = 0;
  while (true) {
    try {
      await axios.put(
        `${BASE}/organizations/${loserId}/merge`,
        { merge_with_id: masterId },
        { params: { api_token: API_TOKEN } },
      );
      return { ok: true };
    } catch (e) {
      const err = e as AxiosError<any>;
      const status = err.response?.status ?? 0;
      if (status === 429 && attempt < 5) {
        const wait = 1000 * Math.pow(2, attempt);
        await sleep(wait);
        attempt++;
        continue;
      }
      return { ok: false, error: `${status} ${err.response?.data?.error || err.message}` };
    }
  }
}

async function executePlan(plan: PlanRow[]) {
  const autoPlan = plan.filter(p => p.action === 'auto').slice(0, MAX);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(OUT_DIR, `backup-${ts}.ndjson`);
  const logFile = path.join(OUT_DIR, `merge-log-${ts}.csv`);
  const backup = fs.createWriteStream(backupFile);
  const log = fs.createWriteStream(logFile);
  log.write('ts,orgnr,master_id,loser_id,status,error\n');

  console.log(`Executing ${autoPlan.length} merge plans...`);
  let done = 0, ok = 0, fail = 0;

  for (const row of autoPlan) {
    const loserIds = row.loser_ids.split(';').map(Number);
    // Backup master + all losers before any merge in this group
    const master = await getOrg(row.master_id);
    if (master) backup.write(JSON.stringify({ role: 'master', org: master }) + '\n');
    for (const lid of loserIds) {
      const loser = await getOrg(lid);
      if (loser) backup.write(JSON.stringify({ role: 'loser', org: loser }) + '\n');
    }

    for (const lid of loserIds) {
      const r = await mergeOrg(row.master_id, lid);
      const ts2 = new Date().toISOString();
      if (r.ok) {
        ok++;
        log.write(`${ts2},${row.orgnr},${row.master_id},${lid},ok,\n`);
        process.stdout.write(`✓ ${row.master_id} ← ${lid} (${row.master_name})\n`);
      } else {
        fail++;
        log.write(`${ts2},${row.orgnr},${row.master_id},${lid},error,"${r.error.replace(/"/g, '""')}"\n`);
        process.stdout.write(`✗ ${row.master_id} ← ${lid}: ${r.error}\n`);
      }
      await sleep(250);
    }
    done++;
    if (done % 10 === 0) process.stdout.write(`-- progress ${done}/${autoPlan.length} (ok=${ok} fail=${fail})\n`);
  }

  backup.end();
  log.end();
  console.log(`\nDone. ok=${ok} fail=${fail}`);
  console.log(`Backup: ${backupFile}`);
  console.log(`Log:    ${logFile}`);
}

async function main() {
  console.log('Fetching organizations from Pipedrive...');
  const orgs = await fetchAllOrgs();
  console.log(`Total: ${orgs.length}`);

  const plan = planMerges(orgs);
  const autoCount = plan.filter(p => p.action === 'auto').length;
  const reviewCount = plan.filter(p => p.action === 'review').length;
  const totalLosers = plan.reduce((a, p) => a + p.loser_ids.split(';').length, 0);

  console.log(`\nGroups with duplicates: ${plan.length}`);
  console.log(`  auto-merge: ${autoCount} groups (${plan.filter(p => p.action === 'auto').reduce((a, p) => a + p.loser_ids.split(';').length, 0)} merges)`);
  console.log(`  review:     ${reviewCount} groups (${plan.filter(p => p.action === 'review').reduce((a, p) => a + p.loser_ids.split(';').length, 0)} merges)`);
  console.log(`  total loser rows: ${totalLosers}`);

  const planFile = path.join(OUT_DIR, 'merge-plan.csv');
  writeCsv(plan, planFile);
  console.log(`\nPlan written: ${planFile}`);

  if (!CONFIRM) {
    console.log('\nDry-run only. Re-run with --confirm to execute auto-merges.');
    return;
  }

  await executePlan(plan);
}

main().catch(e => { console.error(e); process.exit(1); });
