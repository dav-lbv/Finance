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

La première page (`WelcomeScreen`) propose Apple, Google, « sans compte » ou la restauration d'un fichier.
La restauration depuis un **fichier** (Réglages → Données, ou première page) fonctionne partout, sans configuration.

**Google (web / PWA)** : sauvegarde dans le dossier privé `appDataFolder` de Google Drive.
1. Google Cloud Console → créer un projet → *API et services* → activer **Google Drive API**.
2. Écran de consentement OAuth, puis *Identifiants* → **ID client OAuth (Application Web)**, en ajoutant l'URL de l'app dans les origines JavaScript autorisées.
3. Créer `.env` : `VITE_GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com`, puis rebuild.

**Dans l'app iOS native** : la fenêtre Google web n'est pas autorisée dans la WebView. Il faut un plugin natif
(ex. `@capacitor-community/google-auth` / Google Sign-In iOS SDK) avec un ID client de type iOS ; non inclus pour l'instant.

**Apple / iCloud** : nécessite un compte Apple Developer payant, la capacité *Sign in with Apple* et *iCloud (CloudKit / Key-Value)*
dans Xcode, plus un petit plugin natif de stockage iCloud ; non inclus pour l'instant (le bouton affiche l'indisponibilité).
