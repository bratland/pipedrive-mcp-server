#!/usr/bin/env npx tsx
/**
 * Render the 'review' rows from merge-plan.csv as side-by-side comparisons
 * so each multi-owner conflict can be approved or rejected.
 *
 *   npx tsx scripts/review-org-merges.ts                # print to stdout + write review-decisions.csv
 *   npx tsx scripts/review-org-merges.ts --execute      # read review-decisions.csv and merge rows marked 'merge'
 *
 * On --execute, the script applies the same backup + 429-retry safeguards as merge-org-duplicates.ts.
 */

import axios, { AxiosError } from 'axios';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';

const API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
if (!API_TOKEN) { console.error('Missing PIPEDRIVE_API_TOKEN'); process.exit(1); }

const BASE = 'https://api.pipedrive.com/v1';
const OUT_DIR = path.join(process.cwd(), 'scripts', 'out');
const PLAN_FILE = path.join(OUT_DIR, 'merge-plan.csv');
const DECISIONS_FILE = path.join(OUT_DIR, 'review-decisions.csv');

const EXECUTE = process.argv.includes('--execute');
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function parseCsv(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let cur = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { inQ = !inQ; cur += c; continue; }
    if (c === '\n' && !inQ) { lines.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (cur) lines.push(cur);
  const split = (l: string) => {
    const out: string[] = []; let v = '', q = false;
    for (let i = 0; i < l.length; i++) {
      const c = l[i];
      if (c === '"') {
        if (q && l[i + 1] === '"') { v += '"'; i++; }
        else q = !q;
      } else if (c === ',' && !q) { out.push(v); v = ''; }
      else v += c;
    }
    out.push(v);
    return out;
  };
  const header = split(lines.shift()!);
  return lines.filter(Boolean).map(l => {
    const cells = split(l);
    const row: Record<string, string> = {};
    header.forEach((h, i) => row[h] = cells[i] ?? '');
    return row;
  });
}

async function getOrg(id: number): Promise<any> {
  try {
    const r = await axios.get(`${BASE}/organizations/${id}`, { params: { api_token: API_TOKEN } });
    return r.data?.data;
  } catch { return null; }
}

function fmt(o: any): Record<string, string> {
  if (!o) return {};
  return {
    id: String(o.id),
    name: o.name ?? '',
    owner: o.owner_id?.name ?? '',
    address: o.address ?? '',
    add_time: (o.add_time || '').slice(0, 10),
    update_time: (o.update_time || '').slice(0, 10),
    won: String(o.won_deals_count ?? 0),
    open: String(o.open_deals_count ?? 0),
    closed: String(o.closed_deals_count ?? 0),
    lost: String(o.lost_deals_count ?? 0),
    people: String(o.people_count ?? 0),
    activities: String(o.activities_count ?? 0),
    notes: String(o.notes_count ?? 0),
    files: String(o.files_count ?? 0),
    mails: String(o.email_messages_count ?? 0),
  };
}

function renderGroup(orgnr: string, master: any, losers: any[]): string {
  const cols = ['name', 'owner', 'address', 'add_time', 'update_time',
                'won', 'open', 'closed', 'lost', 'people', 'activities', 'notes', 'files', 'mails'];
  const all = [master, ...losers];
  const cells = all.map(fmt);
  const headers = ['MASTER', ...losers.map((_, i) => `LOSER#${i + 1}`)];
  const idLine = cells.map((c, i) => `${headers[i]} (id ${c.id})`);

  const labelW = 12;
  const colW = Math.max(...all.map((_, i) => idLine[i].length), 30);

  const lines: string[] = [];
  lines.push(`\n──── orgnr ${orgnr} ────`);
  lines.push(' '.repeat(labelW) + idLine.map(s => s.padEnd(colW)).join('  '));
  for (const k of cols) {
    const row = ' ' + k.padEnd(labelW - 1) + cells.map(c => (c[k] || '').slice(0, colW).padEnd(colW)).join('  ');
    lines.push(row);
  }
  return lines.join('\n');
}

async function buildReview() {
  if (!fs.existsSync(PLAN_FILE)) { console.error(`Missing ${PLAN_FILE}. Run merge-org-duplicates.ts first.`); process.exit(1); }
  const plan = parseCsv(fs.readFileSync(PLAN_FILE, 'utf8'));
  const review = plan.filter(r => r.action === 'review');

  console.log(`Loaded ${plan.length} plan rows; ${review.length} marked review.\n`);

  const decisions: { orgnr: string; master_id: string; loser_ids: string; flags: string; decision: string; notes: string }[] = [];

  for (const r of review) {
    const masterId = parseInt(r.master_id, 10);
    const loserIds = r.loser_ids.split(';').map(Number);
    const master = await getOrg(masterId);
    const losers: any[] = [];
    for (const lid of loserIds) {
      losers.push(await getOrg(lid));
      await sleep(120);
    }
    console.log(renderGroup(r.orgnr, master, losers));
    console.log(`  flags: ${r.flags}`);
    decisions.push({
      orgnr: r.orgnr,
      master_id: r.master_id,
      loser_ids: r.loser_ids,
      flags: r.flags,
      decision: '',
      notes: '',
    });
  }

  const cols = ['orgnr', 'master_id', 'loser_ids', 'flags', 'decision', 'notes'];
  const esc = (v: string) => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const lines = [cols.join(',')];
  for (const d of decisions) lines.push(cols.map(c => esc((d as any)[c])).join(','));
  fs.writeFileSync(DECISIONS_FILE, lines.join('\n') + '\n');
  console.log(`\nWrote ${DECISIONS_FILE}`);
  console.log(`Fill in 'decision' column with 'merge' or 'skip' (or 'swap' to flip master/loser), then run --execute.`);
}

async function mergeOrg(masterId: number, loserId: number) {
  let attempt = 0;
  while (true) {
    try {
      await axios.put(`${BASE}/organizations/${loserId}/merge`,
        { merge_with_id: masterId },
        { params: { api_token: API_TOKEN } });
      return { ok: true as const };
    } catch (e) {
      const err = e as AxiosError<any>;
      const status = err.response?.status ?? 0;
      if (status === 429 && attempt < 5) { await sleep(1000 * 2 ** attempt); attempt++; continue; }
      return { ok: false as const, error: `${status} ${err.response?.data?.error || err.message}` };
    }
  }
}

async function execute() {
  if (!fs.existsSync(DECISIONS_FILE)) { console.error(`Missing ${DECISIONS_FILE}. Run without --execute first.`); process.exit(1); }
  const decisions = parseCsv(fs.readFileSync(DECISIONS_FILE, 'utf8'));
  const toMerge = decisions.filter(d => d.decision === 'merge' || d.decision === 'swap');
  console.log(`Decisions: ${decisions.length} total, ${toMerge.length} actionable.`);
  if (toMerge.length === 0) return;

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(OUT_DIR, `review-backup-${ts}.ndjson`);
  const logFile = path.join(OUT_DIR, `review-log-${ts}.csv`);
  const backup = fs.createWriteStream(backupFile);
  const log = fs.createWriteStream(logFile);
  log.write('ts,orgnr,master_id,loser_id,decision,status,error\n');

  let ok = 0, fail = 0;
  for (const d of toMerge) {
    let masterId = parseInt(d.master_id, 10);
    let loserIds = d.loser_ids.split(';').map(Number);
    if (d.decision === 'swap') {
      // promote first loser to master; the original master becomes a loser
      const newMaster = loserIds[0];
      const newLosers = [masterId, ...loserIds.slice(1)];
      masterId = newMaster;
      loserIds = newLosers;
    }
    const m = await getOrg(masterId);
    if (m) backup.write(JSON.stringify({ role: 'master', org: m }) + '\n');
    for (const lid of loserIds) {
      const lo = await getOrg(lid);
      if (lo) backup.write(JSON.stringify({ role: 'loser', org: lo }) + '\n');
    }
    for (const lid of loserIds) {
      const r = await mergeOrg(masterId, lid);
      const ts2 = new Date().toISOString();
      if (r.ok) {
        ok++;
        log.write(`${ts2},${d.orgnr},${masterId},${lid},${d.decision},ok,\n`);
        console.log(`✓ ${masterId} ← ${lid}`);
      } else {
        fail++;
        log.write(`${ts2},${d.orgnr},${masterId},${lid},${d.decision},error,"${r.error.replace(/"/g, '""')}"\n`);
        console.log(`✗ ${masterId} ← ${lid}: ${r.error}`);
      }
      await sleep(250);
    }
  }
  backup.end(); log.end();
  console.log(`\nDone. ok=${ok} fail=${fail}\nBackup: ${backupFile}\nLog: ${logFile}`);
}

(EXECUTE ? execute() : buildReview()).catch(e => { console.error(e); process.exit(1); });
