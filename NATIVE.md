# Mon Kanda — application native (iOS / Android)

L'application web est enveloppée par [Capacitor](https://capacitorjs.com). Le code est le même partout.

## Stockage des données

| Plateforme | Base | Détail |
|---|---|---|
| iPhone / iPad, Android | **SQLite** (`@capacitor-community/sqlite`) | Fichier dans le stockage interne de l'appareil, schéma relationnel versionné (`src/db/schema.ts`) |
| Web / PWA | **IndexedDB** | Les anciennes données `localStorage` sont migrées automatiquement au premier lancement |

Les écritures SQLite se font en **une transaction** : si une écriture échoue, rien n'est modifié.
Les tests de la couche SQLite : `bun test`.

## Biométrie

- **iOS** : `NSFaceIDUsageDescription` est déclaré dans `ios/App/App/Info.plist`. La demande d'accès à Face ID
  s'affiche quand l'utilisateur active le déverrouillage biométrique.
- **Android** : `USE_BIOMETRIC` (et `USE_FINGERPRINT` jusqu'à Android 9) dans `AndroidManifest.xml`.
- **Web / PWA** : WebAuthn avec l'authentificateur de la plateforme (Face ID / Touch ID du navigateur).

Le mot de passe de verrouillage n'est jamais stocké en clair (PBKDF2-SHA256, 120 000 itérations).

## Compiler sur le Mac

```bash
bun install
bun run ios        # build web + synchronisation + ouvre Xcode
bun run android    # idem pour Android Studio
```

Dans Xcode : choisir l'équipe de signature (Signing & Capabilities), brancher l'iPhone, puis Run.
Après toute modification du code web : relancer `bun run ios` (ou `bun run cap:sync`).

## Compte Google / Apple (changement de téléphone)

La première page propose Apple, Google, « sans compte » ou la restauration d'un fichier. Lier un compte sert à
**retrouver sa configuration sur un nouveau téléphone** : Google → dossier privé *appDataFolder* de Google Drive ;
Apple → iCloud (stockage clé-valeur, lié au compte iCloud de l'iPhone, 1 Mo max). La restauration par **fichier**
(Réglages → Données) fonctionne partout sans rien configurer.

### Apple (iPhone) — nécessite un compte Apple Developer payant (99 €/an)
Sign in with Apple et iCloud ne sont pas disponibles avec un compte gratuit.
1. Dans Xcode, cible **App → Signing & Capabilities** : l'équipe payante est choisie ; les capacités *Sign in with Apple* et *iCloud (Key-value storage)* sont déjà déclarées dans `App/App.entitlements` (si Xcode les affiche en rouge, cliquez « + Capability » et ajoutez-les, il enregistrera l'identifiant sur le portail).
2. Sur l'iPhone, être connecté à iCloud (Réglages → votre nom).
3. Rien d'autre : le plugin natif `KandaICloudPlugin.swift` est déjà enregistré (`MainViewController`).

### Google (iPhone)
1. [Google Cloud Console](https://console.cloud.google.com) → créer un projet → *API et services* → activer **Google Drive API**.
2. *Écran de consentement OAuth* (type Externe) : ajouter votre compte dans « Utilisateurs test » et la portée `.../auth/drive.appdata`.
3. *Identifiants* → **ID client OAuth → iOS**, avec l'ID de bundle `app.monkanda.finance`.
4. Copier l'ID client dans `.env` : `VITE_GOOGLE_IOS_CLIENT_ID=XXXX.apps.googleusercontent.com`.
5. Dans `ios/App/App/Info.plist`, remplacer `com.googleusercontent.apps.REMPLACER_PAR_VOTRE_ID_CLIENT_IOS` par l'ID client **inversé** (`com.googleusercontent.apps.XXXX`).
6. `bun run ios`.

### Google (navigateur / PWA)
Même projet : créer un ID client **Application Web** (origine JavaScript = l'URL de l'app), puis `.env` : `VITE_GOOGLE_CLIENT_ID=...`.

Sans ces identifiants, le bouton affiche simplement un message d'explication.
