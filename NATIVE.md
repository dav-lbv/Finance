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
