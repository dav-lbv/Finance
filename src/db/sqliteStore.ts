import { AppData, Expense, ExpenseCategory, SavingsDeposit, SavingsProject } from '../types';
import { MIGRATIONS, SCHEMA_VERSION } from './schema';

/** Plus petit dénominateur commun entre le plugin Capacitor SQLite et les tests. */
export interface SqlStatement {
  statement: string;
  values?: unknown[];
}

export interface SqlDriver {
  /** Exécute des instructions sans paramètres */
  execute(statements: string): Promise<void>;
  /** Exécute plusieurs instructions paramétrées dans UNE transaction (tout ou rien) */
  executeSet(set: SqlStatement[]): Promise<void>;
  query(statement: string, values?: unknown[]): Promise<Record<string, unknown>[]>;
}

const b = (v: unknown): number => (v ? 1 : 0);
const n = <T,>(v: T | undefined): T | null => (v === undefined ? null : v);
const str = (v: unknown): string | undefined => (v === null || v === undefined ? undefined : String(v));
const num = (v: unknown): number | undefined => (v === null || v === undefined ? undefined : Number(v));

/** Persistance relationnelle de l'application dans SQLite. */
export class SqliteAppStore {
  constructor(private driver: SqlDriver) {}

  /** Crée / met à jour le schéma. */
  async migrate(): Promise<void> {
    await this.driver.execute(`CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)`);
    const rows = await this.driver.query(`SELECT value FROM meta WHERE key = 'schema_version'`);
    let version = rows.length ? parseInt(String(rows[0].value), 10) : 0;

    while (version < SCHEMA_VERSION) {
      const set: SqlStatement[] = MIGRATIONS[version].map((statement) => ({ statement }));
      set.push({
        statement: `INSERT INTO meta (key, value) VALUES ('schema_version', ?)
                    ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        values: [String(version + 1)],
      });
      await this.driver.executeSet(set);
      version += 1;
    }
  }

  /** Lit toutes les données ; `null` si la base est vide (premier lancement). */
  async load(): Promise<AppData | null> {
    const profileRows = await this.driver.query(`SELECT * FROM profile WHERE id = 1`);
    if (!profileRows.length) return null;
    const p = profileRows[0];

    const securityRows = await this.driver.query(`SELECT * FROM security WHERE id = 1`);
    const s = securityRows[0] || {};

    const budgets = await this.driver.query(`SELECT * FROM monthly_budgets`);
    const expenseRows = await this.driver.query(`SELECT * FROM expenses ORDER BY rowid`);
    const savingsRows = await this.driver.query(`SELECT * FROM savings ORDER BY rowid`);
    const projectRows = await this.driver.query(`SELECT * FROM savings_projects ORDER BY rowid`);
    const presetRows = await this.driver.query(`SELECT * FROM expense_presets ORDER BY position`);
    const categoryRows = await this.driver.query(`SELECT * FROM project_categories ORDER BY position`);

    const monthlyBudgets: AppData['monthlyBudgets'] = {};
    budgets.forEach((r) => {
      const key = String(r.month_key);
      monthlyBudgets[key] = {
        monthKey: key,
        baseBudget: Number(r.base_budget),
        salaryReceived: num(r.salary_received),
        notes: str(r.notes),
      };
    });

    const expenses: AppData['expenses'] = {};
    expenseRows.forEach((r) => {
      const key = String(r.month_key);
      const expense: Expense = {
        id: String(r.id),
        title: String(r.title),
        amount: Number(r.amount),
        category: String(r.category) as ExpenseCategory,
        date: String(r.date),
        isRecurring: !!r.is_recurring,
        recurringOriginalAmount: num(r.recurring_original_amount),
        note: str(r.note),
        isPaid: !!r.is_paid,
      };
      (expenses[key] ||= []).push(expense);
    });
    // Les mois sans dépense doivent exister comme tableaux vides si un budget y est défini
    Object.keys(monthlyBudgets).forEach((k) => (expenses[k] ||= []));

    const savings: SavingsDeposit[] = savingsRows.map((r) => ({
      id: String(r.id),
      amount: Number(r.amount),
      date: String(r.date),
      note: str(r.note),
      depositType: str(r.deposit_type) as SavingsDeposit['depositType'],
      projectId: str(r.project_id),
      projectName: str(r.project_name),
    }));

    const savingsProjects: SavingsProject[] = projectRows.map((r) => ({
      id: String(r.id),
      title: String(r.title),
      targetAmount: Number(r.target_amount),
      currentAmount: Number(r.current_amount),
      targetDate: str(r.target_date),
      category: str(r.category),
      isClosed: !!r.is_closed,
      closedAt: str(r.closed_at),
      createdAt: String(r.created_at),
      note: str(r.note),
    }));

    return {
      user: {
        firstName: str(p.first_name),
        lastName: str(p.last_name),
        username: str(p.username),
        fullName: String(p.full_name ?? ''),
        phone: String(p.phone ?? ''),
        email: String(p.email ?? ''),
        defaultSalary: Number(p.default_salary ?? 0),
        currency: String(p.currency ?? 'FCFA'),
        avatarUrl: str(p.avatar_url),
        authProvider: str(p.auth_provider) as AppData['user']['authProvider'],
        isEmailVerified: !!p.is_email_verified,
        isOnboarded: !!p.is_onboarded,
        themePreference: str(p.theme_preference) as AppData['user']['themePreference'],
      },
      security: {
        isLockEnabled: !!s.is_lock_enabled,
        passwordHash: String(s.password_hash ?? ''),
        lastLockedAt: num(s.last_locked_at),
        useBiometrics: !!s.use_biometrics,
        biometricType: str(s.biometric_type) as AppData['security']['biometricType'],
        biometricCredentialId: str(s.biometric_credential_id),
      },
      monthlyBudgets,
      expenses,
      savings,
      savingsProjects,
      expensePresets: presetRows.map((r) => ({
        id: String(r.id),
        title: String(r.title),
        category: String(r.category) as ExpenseCategory,
        defaultAmount: num(r.default_amount),
      })),
      projectCategories: categoryRows.map((r) => String(r.name)),
    };
  }

  /** Écrit toutes les données en une transaction : si une écriture échoue, rien n'est modifié. */
  async save(data: AppData): Promise<void> {
    const u = data.user;
    const sec = data.security;
    const set: SqlStatement[] = [
      ...['expenses', 'savings', 'savings_projects', 'expense_presets', 'project_categories', 'monthly_budgets'].map(
        (t) => ({ statement: `DELETE FROM ${t}` })
      ),
      {
        statement: `INSERT INTO profile (id, first_name, last_name, username, full_name, phone, email, default_salary,
                      currency, avatar_url, auth_provider, is_email_verified, is_onboarded, theme_preference)
                    VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                      first_name = excluded.first_name, last_name = excluded.last_name, username = excluded.username,
                      full_name = excluded.full_name, phone = excluded.phone, email = excluded.email,
                      default_salary = excluded.default_salary, currency = excluded.currency,
                      avatar_url = excluded.avatar_url, auth_provider = excluded.auth_provider,
                      is_email_verified = excluded.is_email_verified, is_onboarded = excluded.is_onboarded,
                      theme_preference = excluded.theme_preference`,
        values: [
          n(u.firstName), n(u.lastName), n(u.username), u.fullName, u.phone, u.email, u.defaultSalary,
          u.currency, n(u.avatarUrl), n(u.authProvider), b(u.isEmailVerified), b(u.isOnboarded), n(u.themePreference),
        ],
      },
      {
        statement: `INSERT INTO security (id, is_lock_enabled, password_hash, last_locked_at, use_biometrics,
                      biometric_type, biometric_credential_id)
                    VALUES (1, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                      is_lock_enabled = excluded.is_lock_enabled, password_hash = excluded.password_hash,
                      last_locked_at = excluded.last_locked_at, use_biometrics = excluded.use_biometrics,
                      biometric_type = excluded.biometric_type,
                      biometric_credential_id = excluded.biometric_credential_id`,
        values: [
          b(sec.isLockEnabled), sec.passwordHash, n(sec.lastLockedAt), b(sec.useBiometrics),
          n(sec.biometricType), n(sec.biometricCredentialId),
        ],
      },
    ];

    Object.values(data.monthlyBudgets).forEach((m) =>
      set.push({
        statement: `INSERT INTO monthly_budgets (month_key, base_budget, salary_received, notes) VALUES (?, ?, ?, ?)`,
        values: [m.monthKey, m.baseBudget, n(m.salaryReceived), n(m.notes)],
      })
    );

    Object.entries(data.expenses).forEach(([monthKey, list]) =>
      list.forEach((e) =>
        set.push({
          statement: `INSERT INTO expenses (id, month_key, title, amount, category, date, is_recurring,
                        recurring_original_amount, note, is_paid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          values: [
            e.id, monthKey, e.title, e.amount, e.category, e.date, b(e.isRecurring),
            n(e.recurringOriginalAmount), n(e.note), b(e.isPaid),
          ],
        })
      )
    );

    data.savings.forEach((d) =>
      set.push({
        statement: `INSERT INTO savings (id, amount, date, note, deposit_type, project_id, project_name)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
        values: [d.id, d.amount, d.date, n(d.note), n(d.depositType), n(d.projectId), n(d.projectName)],
      })
    );

    (data.savingsProjects || []).forEach((p) =>
      set.push({
        statement: `INSERT INTO savings_projects (id, title, target_amount, current_amount, target_date, category,
                      is_closed, closed_at, created_at, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values: [
          p.id, p.title, p.targetAmount, p.currentAmount, n(p.targetDate), n(p.category),
          b(p.isClosed), n(p.closedAt), p.createdAt, n(p.note),
        ],
      })
    );

    data.expensePresets.forEach((p, i) =>
      set.push({
        statement: `INSERT INTO expense_presets (id, title, category, default_amount, position) VALUES (?, ?, ?, ?, ?)`,
        values: [p.id, p.title, p.category, n(p.defaultAmount), i],
      })
    );

    (data.projectCategories || []).forEach((name, i) =>
      set.push({
        statement: `INSERT INTO project_categories (name, position) VALUES (?, ?)`,
        values: [name, i],
      })
    );

    await this.driver.executeSet(set);
  }
}
