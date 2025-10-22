
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f9facd6ad78c457c92932d4b03f009cd',
  appName: 'Dr.Plant',
  webDir: 'dist',
  // Remove server config for production builds
  // server: {
  //   url: 'https://f9facd6a-d78c-457c-9293-2d4b03f009cd.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "small",
      spinnerColor: "#22c55e"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  },
  android: {
    buildOptions: {
      keystorePath: 'android.keystore',
      keystoreAlias: 'plant-patho-pal',
    }
  },
  ios: {
    contentInset: "automatic"
  }
};

export default config;
