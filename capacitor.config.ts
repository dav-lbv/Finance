import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.monkanda.finance',
  appName: 'Mon Kanda',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    backgroundColor: '#050506',
  },
  android: {
    backgroundColor: '#050506',
  },
  plugins: {
    SocialLogin: {
      providers: { google: true, apple: true, facebook: false, twitter: false },
    },
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      androidIsEncryption: false,
    },
  },
};

export default config;
