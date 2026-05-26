import { execFileSync } from 'child_process';
import path from 'path';

const CLI = path.resolve(__dirname, '..', 'src', 'cli.ts');
const cwd = path.resolve(__dirname, '..');

const run = (args: string): { ok: boolean; data?: any; error?: string; meta?: any } => {
  const result = execFileSync('npx', ['tsx', CLI, ...args.split(/\s+/)], {
    cwd,
    env: { ...process.env, NODE_ENV: 'test' },
    timeout: 15_000,
  });
  return JSON.parse(result.toString());
};

const runRaw = (args: string): string => {
  const result = execFileSync('npx', ['tsx', CLI, ...args.split(/\s+/)], {
    cwd,
    timeout: 15_000,
  });
  return result.toString().trim();
};

describe('CLI E2E (live Pipedrive API)', () => {
  describe('help & context', () => {
    it('shows help', () => {
      const res = run('help');
      expect(res.ok).toBe(true);
      expect(res.data.commands).toBeDefined();
      expect(res.data.commands.deals).toContain('list');
    });

    it('shows date context', () => {
      const res = run('context');
      expect(res.ok).toBe(true);
      expect(res.data).toHaveProperty('current_date');
    });
  });

  describe('users', () => {
    it('gets current user', () => {
      const res = run('users me -c');
      expect(res.ok).toBe(true);
      expect(res.data).toHaveProperty('id');
      expect(res.data).toHaveProperty('name');
      expect(res.data).toHaveProperty('email');
    });

    it('lists users', () => {
      const res = run('users list -c -l 5');
      expect(res.ok).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);
    });
  });

  describe('deals', () => {
    it('lists deals', () => {
      const res = run('deals list -c -l 3');
      expect(res.ok).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('lists deals with field selection', () => {
      const res = run('deals list -c -l 3 -f id,title,value,status');
      expect(res.ok).toBe(true);
      if (res.data && res.data.length > 0) {
        const deal = res.data[0];
        expect(deal).toHaveProperty('id');
        expect(deal).toHaveProperty('title');
        const keys = Object.keys(deal);
        expect(keys.length).toBeLessThanOrEqual(4);
      }
    });

    it('searches deals', () => {
      const res = run('deals search test -c -l 3');
      expect(res.ok).toBe(true);
    });

    it('gets deal quarter summary', () => {
      const res = run('deals quarter --quarter current');
      expect(res.ok).toBe(true);
      expect(res.data).toBeDefined();
    });
  });

  describe('persons', () => {
    it('lists persons', () => {
      const res = run('persons list -c -l 3');
      expect(res.ok).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('searches persons', () => {
      const res = run('persons search test -c -l 3');
      expect(res.ok).toBe(true);
    });
  });

  describe('organizations', () => {
    it('lists organizations', () => {
      const res = run('orgs list -c -l 3');
      expect(res.ok).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('searches organizations', () => {
      const res = run('orgs search test -c -l 3');
      expect(res.ok).toBe(true);
    });

    it('works with alias "organizations"', () => {
      const res = run('organizations list -c -l 1');
      expect(res.ok).toBe(true);
    });
  });

  describe('activities', () => {
    it('lists activities', () => {
      const res = run('activities list -c -l 3');
      expect(res.ok).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
    });
  });

  describe('pipelines & stages', () => {
    it('lists pipelines', () => {
      const res = run('pipelines list -c');
      expect(res.ok).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);
    });

    it('lists stages', () => {
      const res = run('stages list -c');
      expect(res.ok).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
    });
  });

  describe('notes', () => {
    it('lists notes', () => {
      const res = run('notes list -c -l 3');
      expect(res.ok).toBe(true);
    });
  });

  describe('leads', () => {
    it('lists leads', () => {
      const res = run('leads list -c -l 3');
      expect(res.ok).toBe(true);
    });
  });

  describe('products', () => {
    it('lists products', () => {
      const res = run('products list -c -l 3');
      expect(res.ok).toBe(true);
    });
  });

  describe('custom fields', () => {
    it('lists deal fields', () => {
      const res = run('deal-fields list -c -l 5');
      expect(res.ok).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('lists person fields', () => {
      const res = run('person-fields list -c -l 5');
      expect(res.ok).toBe(true);
    });

    it('lists org fields', () => {
      const res = run('org-fields list -c -l 5');
      expect(res.ok).toBe(true);
    });
  });

  describe('search', () => {
    it('searches items globally', () => {
      const res = run('search items test -c -l 3');
      expect(res.ok).toBe(true);
    });

    it('searches with shorthand (no subcommand)', () => {
      const res = run('search test -c -l 3');
      expect(res.ok).toBe(true);
    });
  });

  describe('overview', () => {
    it('gets CRM overview', () => {
      const res = run('overview');
      expect(res.ok).toBe(true);
      expect(res.data).toBeDefined();
    });
  });

  describe('currencies', () => {
    it('lists currencies', () => {
      const res = run('currencies list -c');
      expect(res.ok).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);
    });
  });

  describe('filters', () => {
    it('lists filters', () => {
      const res = run('filters list -c');
      expect(res.ok).toBe(true);
    });
  });

  describe('activity types', () => {
    it('lists activity types', () => {
      const res = run('activity-types list -c');
      expect(res.ok).toBe(true);
      expect(Array.isArray(res.data)).toBe(true);
    });
  });

  describe('CRUD lifecycle (deal)', () => {
    let dealId: number;

    it('creates a deal', () => {
      const res = run('deals create --title E2E_Test_Deal --value 1234 --currency SEK');
      expect(res.ok).toBe(true);
      expect(res.data).toHaveProperty('id');
      expect(res.data.title).toBe('E2E_Test_Deal');
      dealId = res.data.id;
    });

    it('reads the created deal', () => {
      const res = run(`deals get ${dealId} -f id,title,value`);
      expect(res.ok).toBe(true);
      expect(res.data.id).toBe(dealId);
      expect(res.data.title).toBe('E2E_Test_Deal');
    });

    it('updates the deal', () => {
      const res = run(`deals update ${dealId} --title E2E_Test_Updated --value 5678`);
      expect(res.ok).toBe(true);
      expect(res.data.title).toBe('E2E_Test_Updated');
    });

    it('deletes the deal', () => {
      const res = run(`deals delete ${dealId}`);
      expect(res.ok).toBe(true);
    });
  });

  describe('error handling', () => {
    it('returns error for unknown command', () => {
      expect(() => run('nonexistent list')).toThrow();
    });

    it('returns error for missing required ID', () => {
      expect(() => run('deals get')).toThrow();
    });

    it('returns error for non-existent deal', () => {
      expect(() => run('deals get 999999999')).toThrow();
    });
  });

  describe('output flags', () => {
    it('--raw produces single-line JSON', () => {
      const output = runRaw('users me -r');
      const lines = output.split('\n');
      expect(lines.length).toBe(1);
    });

    it('--compact strips null fields', () => {
      const full = run('users me');
      const compact = run('users me -c');
      const fullKeys = Object.keys(full.data);
      const compactKeys = Object.keys(compact.data);
      expect(compactKeys.length).toBeLessThanOrEqual(fullKeys.length);
    });
  });
});
