/**
 * Hachage du mot de passe de verrouillage : le mot de passe n'est jamais stocké en clair.
 * Format : `pbkdf2$<itérations>$<sel base64>$<hash base64>`
 */

const ITERATIONS = 120_000;
const KEY_BITS = 256;

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<Uint8Array> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('Le chiffrement du navigateur (WebCrypto) est indisponible.');
  const key = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, KEY_BITS);
  return new Uint8Array(bits);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(new ArrayBuffer(16)));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

/** Vrai si le mot de passe correspond. Accepte aussi l'ancien format (texte brut) pour migrer sans casser. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  if (!stored.startsWith('pbkdf2$')) return password === stored; // ancien format : sera re-haché au prochain enregistrement
  const [, iter, salt, hash] = stored.split('$');
  const candidate = await derive(password, fromBase64(salt), parseInt(iter, 10));
  return timingSafeEqual(candidate, fromBase64(hash));
}

export function isHashed(stored: string): boolean {
  return stored.startsWith('pbkdf2$');
}
