import { Database } from 'bun:sqlite';
import { describe, expect, test } from 'bun:test';
import { SqlDriver, SqliteAppStore } from '../src/db/sqliteStore';
import { AppData } from '../src/types';

/** Adaptateur : mêmes opérations que le plugin Capacitor SQLite, mais sur bun:sqlite. */
function memoryDriver(): { driver: SqlDriver; db: Database } {
  const db = new Database(':memory:');
  const driver: SqlDriver = {
    execute: async (statements) => {
      db.exec(statements);
    },
    executeSet: async (set) => {
      db.exec('BEGIN');
      try {
        set.forEach(({ statement, values }) => db.prepare(statement).run(...((values ?? []) as never[])));
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
    query: async (statement, values) => db.prepare(statement).all(...((values ?? []) as never[])) as Record<string, unknown>[],
  };
  return { driver, db };
}

const sample: AppData = {
  user: {
    firstName: 'Awa', lastName: 'Kone', username: 'awa', fullName: 'Awa Kone', phone: '+225 00', email: 'a@b.c',
    defaultSalary: 500000, currency: 'FCFA', avatarUrl: 'data:image/svg+xml;utf8,%3Csvg%3E', isOnboarded: true,
    themePreference: 'dark', isEmailVerified: false,
  },
  security: {
    isLockEnabled: true, passwordHash: 'pbkdf2$1$c2FsdA==$aGFzaA==', useBiometrics: true, biometricType: 'both',
    biometricCredentialId: 'abc_-123',
  },
  monthlyBudgets: {
    '2026-10': { monthKey: '2026-10', baseBudget: 400000, salaryReceived: 500000, notes: "L'été" },
    '2026-09': { monthKey: '2026-09', baseBudget: 300000 },
  },
  expenses: {
    '2026-10': [
      { id: 'e2', title: 'Courses', amount: 80000, category: 'Alimentation', date: '2026-10-05', isRecurring: false, isPaid: true },
      { id: 'e1', title: 'Loyer', amount: 150000, category: 'Logement', date: '2026-10-02', isRecurring: true, recurringOriginalAmount: 140000, note: 'Mensuel', isPaid: false },
    ],
    '2026-09': [],
  },
  savings: [
    { id: 's2', amount: 50000, date: '2026-10-09', projectId: 'p1', projectName: 'Voyage', depositType: 'project', note: 'x' },
    { id: 's1', amount: 100000, date: '2026-10-03', depositType: 'monthly' },
  ],
  savingsProjects: [
    { id: 'p2', title: 'Vélo', targetAmount: 300000, currentAmount: 300000, isClosed: true, closedAt: '2026-09-25', createdAt: '2026-06-10', category: 'Mobilité' },
    { id: 'p1', title: 'Voyage', targetAmount: 350000, currentAmount: 170000, isClosed: false, createdAt: '2026-09-01', targetDate: '2026-12-31', note: 'Été' },
  ],
  expensePresets: [
    { id: 'pre-a', title: 'Loyer', category: 'Logement', defaultAmount: 150000 },
    { id: 'pre-b', title: 'Internet', category: 'Factures & Abonnements' },
  ],
  projectCategories: ['Voyage', 'Urgence'],
};

// Les champs `undefined` n'existent pas côté base : on compare sans eux
const clean = (v: unknown) => JSON.parse(JSON.stringify(v));

describe('SqliteAppStore', () => {
  test('une base vide renvoie null (premier lancement)', async () => {
    const { driver } = memoryDriver();
    const store = new SqliteAppStore(driver);
    await store.migrate();
    expect(await store.load()).toBeNull();
  });

  test('aller-retour complet sans perte ni réordonnancement', async () => {
    const { driver } = memoryDriver();
    const store = new SqliteAppStore(driver);
    await store.migrate();
    await store.save(sample);
    expect(clean(await store.load())).toEqual(clean(sample));
  });

  test('réécrire remplace les données (pas de doublons)', async () => {
    const { driver } = memoryDriver();
    const store = new SqliteAppStore(driver);
    await store.migrate();
    await store.save(sample);
    await store.save({ ...sample, savings: [sample.savings[1]], projectCategories: [] });
    const loaded = (await store.load())!;
    expect(loaded.savings).toHaveLength(1);
    expect(loaded.projectCategories).toEqual([]);
    expect(loaded.expenses['2026-10']).toHaveLength(2);
  });

  test('les migrations sont idempotentes', async () => {
    const { driver, db } = memoryDriver();
    const store = new SqliteAppStore(driver);
    await store.migrate();
    await store.migrate();
    const row = db.prepare(`SELECT value FROM meta WHERE key = 'schema_version'`).get() as { value: string };
    expect(row.value).toBe('1');
  });

  test('une erreur en cours d\'écriture annule toute la transaction', async () => {
    const { driver } = memoryDriver();
    const store = new SqliteAppStore(driver);
    await store.migrate();
    await store.save(sample);
    const broken = { ...sample, savings: [{ ...sample.savings[0], amount: null as unknown as number }] };
    await expect(store.save(broken)).rejects.toThrow();
    expect(clean(await store.load())).toEqual(clean(sample)); // ancienne version intacte
  });
});
