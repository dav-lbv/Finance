// Utilitaires de dates en Français

export const FRENCH_MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const FRENCH_DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/**
 * Retourne la clé de mois courante au format "YYYY-MM"
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Retourne la date courante au format "YYYY-MM-DD"
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcule la clé du mois précédent ("YYYY-MM")
 */
export function getPreviousMonthKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);

  month -= 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Calcule la clé du mois suivant ("YYYY-MM")
 */
export function getNextMonthKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);

  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Formate "2026-09" en "Septembre 2026"
 */
export function formatMonthKey(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIndex = parseInt(monthStr, 10) - 1;
  const monthName = FRENCH_MONTHS[monthIndex] || monthStr;
  return `${monthName} ${yearStr}`;
}

/**
 * Formate "2026-09" en "Sept. 2026" pour les écrans mobiles étroits
 */
export function formatMonthKeyShort(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  const [yearStr, monthStr] = monthKey.split('-');
  const shortMonths = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
  const monthIndex = parseInt(monthStr, 10) - 1;
  const shortName = shortMonths[monthIndex] || monthStr;
  return `${shortName} ${yearStr}`;
}

/**
 * Formate une date YYYY-MM-DD en "25 sept. 2026"
 */
export function formatDateFr(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    const monthNum = parseInt(month, 10) - 1;
    const shortMonths = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    return `${parseInt(day, 10)} ${shortMonths[monthNum] || month} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Génère la grille du calendrier pour un mois donné "YYYY-MM"
 * Retourne un tableau de jours avec information si dans le mois ou hors mois
 */
export interface CalendarDay {
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function getCalendarGrid(monthKey: string): CalendarDay[] {
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;

  const todayStr = getTodayDateString();

  // Premier jour du mois
  const firstDay = new Date(year, monthIndex, 1);
  // Dernier jour du mois
  const lastDay = new Date(year, monthIndex + 1, 0);
  const totalDaysInMonth = lastDay.getDate();

  // Jour de la semaine du premier jour (0 = Dimanche, 1 = Lundi ...)
  // On veut Lundi = 0, ..., Dimanche = 6
  let firstDayOfWeek = firstDay.getDay() - 1;
  if (firstDayOfWeek === -1) firstDayOfWeek = 6;

  const days: CalendarDay[] = [];

  // Jours du mois précédent pour combler la première semaine
  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
  const prevMonthKey = getPreviousMonthKey(monthKey);
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i;
    const dateString = `${prevMonthKey}-${String(dayNum).padStart(2, '0')}`;
    days.push({
      dateString,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateString === todayStr,
    });
  }

  // Jours du mois courant
  for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
    const dateString = `${monthKey}-${String(dayNum).padStart(2, '0')}`;
    days.push({
      dateString,
      dayNumber: dayNum,
      isCurrentMonth: true,
      isToday: dateString === todayStr,
    });
  }

  // Jours du mois suivant pour compléter la grille jusqu'à 35 ou 42
  const nextMonthKey = getNextMonthKey(monthKey);
  let nextDayNum = 1;
  while (days.length % 7 !== 0 || days.length < 35) {
    const dateString = `${nextMonthKey}-${String(nextDayNum).padStart(2, '0')}`;
    days.push({
      dateString,
      dayNumber: nextDayNum,
      isCurrentMonth: false,
      isToday: dateString === todayStr,
    });
    nextDayNum++;
  }

  return days;
}

/**
 * Formate un montant en devise monétaire (sans décimales pour FCFA)
 */
export function formatCurrency(amount: number, currency: string = 'FCFA'): string {
  const isCfa = /FCFA|CFA|XOF|XAF/i.test(currency);
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: isCfa ? 0 : 2,
    maximumFractionDigits: isCfa ? 0 : 2,
  }).format(amount);
  return `${formatted} ${currency}`;
}
