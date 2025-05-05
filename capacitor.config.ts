
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f9facd6ad78c457c92932d4b03f009cd',
  appName: 'plant-patho-pal',
  webDir: 'dist',
  server: {
    url: 'https://f9facd6a-d78c-457c-9293-2d4b03f009cd.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: 'android.keystore',
      keystoreAlias: 'plant-patho-pal',
    }
  }
};

export default config;
