import { AppData, SavingsDeposit } from '../types';

/**
 * Salaire d'un mois : celui saisi pour ce mois, sinon le salaire de référence des réglages.
 * Un salaire à 0 est considéré comme « non renseigné » (par exemple un mois créé avant la
 * configuration initiale) : on retombe alors sur le salaire de référence.
 */
export function getMonthSalary(data: AppData, monthKey: string): number {
  return data.monthlyBudgets[monthKey]?.salaryReceived || data.user.defaultSalary || 0;
}

/** Un versement affecté à un projet est séparé de l'épargne générale. */
export function isProjectDeposit(deposit: SavingsDeposit): boolean {
  return !!deposit.projectId || deposit.depositType === 'project';
}

/** Sépare l'épargne générale (hors projets) de l'argent versé aux projets. */
export function splitSavings(deposits: SavingsDeposit[]): { general: SavingsDeposit[]; project: SavingsDeposit[] } {
  return {
    general: deposits.filter((d) => !isProjectDeposit(d)),
    project: deposits.filter(isProjectDeposit),
  };
}

export const sumAmounts = (deposits: SavingsDeposit[]): number => deposits.reduce((acc, d) => acc + d.amount, 0);
