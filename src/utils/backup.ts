import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { AppData } from '../types';
import { parseBackup } from './storage';

export function backupFileName(): string {
  return `mon-kanda_sauvegarde_${new Date().toISOString().split('T')[0]}.json`;
}

/**
 * Exporte une sauvegarde complète. Sur iPhone, la feuille de partage s'ouvre :
 * « Enregistrer dans Fichiers » permet de la déposer dans iCloud Drive, Google Drive, etc.
 * Renvoie false si l'utilisateur a annulé.
 */
export async function exportBackup(data: AppData): Promise<boolean> {
  const json = JSON.stringify(data, null, 2);
  const name = backupFileName();

  if (Capacitor.isNativePlatform()) {
    const { uri } = await Filesystem.writeFile({ path: name, data: json, directory: Directory.Cache, encoding: Encoding.UTF8 });
    try {
      await Share.share({ title: 'Sauvegarde Mon Kanda', url: uri, dialogTitle: 'Enregistrer la sauvegarde' });
      return true;
    } catch {
      return false; // feuille de partage fermée
    }
  }

  const file = new File([json], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Sauvegarde Mon Kanda' });
      return true;
    } catch {
      return false;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}

/** Lit un fichier de sauvegarde choisi par l'utilisateur (Fichiers, iCloud Drive, Google Drive…). */
export async function readBackupFile(file: File): Promise<AppData> {
  try {
    return parseBackup(JSON.parse(await file.text()));
  } catch (err) {
    throw err instanceof SyntaxError ? new Error("Ce fichier n'est pas une sauvegarde Mon Kanda valide.") : err;
  }
}
