import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thewastedape.boatbuddy',
  appName: 'Boat Buddy AI',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  android: {
    buildOptions: {
      keystorePath: 'signing.keystore',
      keystoreAlias: 'my-key-alias',
    },
  },
};

export default config;
