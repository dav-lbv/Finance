/**
 * Schéma SQLite de Mon_Kanda (stockage natif iOS / Android).
 * `MIGRATIONS[n]` fait passer la base de la version n à n+1 ; ne jamais modifier une
 * migration déjà publiée : en ajouter une nouvelle.
 */
export const MIGRATIONS: string[][] = [
  [
    `CREATE TABLE IF NOT EXISTS meta (
       key   TEXT PRIMARY KEY,
       value TEXT
     )`,
    `CREATE TABLE IF NOT EXISTS profile (
       id                INTEGER PRIMARY KEY CHECK (id = 1),
       first_name        TEXT,
       last_name         TEXT,
       username          TEXT,
       full_name         TEXT NOT NULL DEFAULT '',
       phone             TEXT NOT NULL DEFAULT '',
       email             TEXT NOT NULL DEFAULT '',
       default_salary    REAL NOT NULL DEFAULT 0,
       currency          TEXT NOT NULL DEFAULT 'FCFA',
       avatar_url        TEXT,
       auth_provider     TEXT,
       is_email_verified INTEGER NOT NULL DEFAULT 0,
       is_onboarded      INTEGER NOT NULL DEFAULT 0,
       theme_preference  TEXT
     )`,
    `CREATE TABLE IF NOT EXISTS security (
       id                    INTEGER PRIMARY KEY CHECK (id = 1),
       is_lock_enabled       INTEGER NOT NULL DEFAULT 0,
       password_hash         TEXT NOT NULL DEFAULT '',
       last_locked_at        INTEGER,
       use_biometrics        INTEGER NOT NULL DEFAULT 0,
       biometric_type        TEXT,
       biometric_credential_id TEXT
     )`,
    `CREATE TABLE IF NOT EXISTS monthly_budgets (
       month_key       TEXT PRIMARY KEY,
       base_budget     REAL NOT NULL DEFAULT 0,
       salary_received REAL,
       notes           TEXT
     )`,
    `CREATE TABLE IF NOT EXISTS expenses (
       id                        TEXT PRIMARY KEY,
       month_key                 TEXT NOT NULL,
       title                     TEXT NOT NULL,
       amount                    REAL NOT NULL,
       category                  TEXT NOT NULL,
       date                      TEXT NOT NULL,
       is_recurring              INTEGER NOT NULL DEFAULT 0,
       recurring_original_amount REAL,
       note                      TEXT,
       is_paid                   INTEGER NOT NULL DEFAULT 0
     )`,
    `CREATE INDEX IF NOT EXISTS idx_expenses_month ON expenses (month_key)`,
    `CREATE TABLE IF NOT EXISTS savings (
       id           TEXT PRIMARY KEY,
       amount       REAL NOT NULL,
       date         TEXT NOT NULL,
       note         TEXT,
       deposit_type TEXT,
       project_id   TEXT,
       project_name TEXT
     )`,
    `CREATE INDEX IF NOT EXISTS idx_savings_date ON savings (date)`,
    `CREATE TABLE IF NOT EXISTS savings_projects (
       id             TEXT PRIMARY KEY,
       title          TEXT NOT NULL,
       target_amount  REAL NOT NULL,
       current_amount REAL NOT NULL DEFAULT 0,
       target_date    TEXT,
       category       TEXT,
       is_closed      INTEGER NOT NULL DEFAULT 0,
       closed_at      TEXT,
       created_at     TEXT NOT NULL,
       note           TEXT
     )`,
    `CREATE TABLE IF NOT EXISTS expense_presets (
       id             TEXT PRIMARY KEY,
       title          TEXT NOT NULL,
       category       TEXT NOT NULL,
       default_amount REAL,
       position       INTEGER NOT NULL DEFAULT 0
     )`,
    `CREATE TABLE IF NOT EXISTS project_categories (
       name     TEXT PRIMARY KEY,
       position INTEGER NOT NULL DEFAULT 0
     )`,
  ],
];

export const SCHEMA_VERSION = MIGRATIONS.length;
export const DB_NAME = 'mon_kanda';
