# 📱 Guida Build Mobile App - Dr.Plant

## ✅ Setup Completato

Ho configurato tutto il necessario per trasformare la tua web app in una mobile app:

- ✅ **Capacitor configurato** per iOS e Android
- ✅ **Icone dell'app** generate (512x512 e 192x192)
- ✅ **Splash screen** creato
- ✅ **Manifest.json** per PWA
- ✅ **Meta tags mobile** aggiunti
- ✅ **Configurazione produzione** pronta

## 🚀 Passi per Build e Pubblicazione

### 1️⃣ Esporta e Clona il Progetto

```bash
# 1. Clicca su "Export to Github" in Lovable
# 2. Clona il repository sul tuo computer
git clone [tuo-repository-url]
cd [nome-progetto]

# 3. Installa le dipendenze
npm install
```

### 2️⃣ Aggiungi le Piattaforme Native

```bash
# Aggiungi Android
npx cap add android

# Aggiungi iOS (solo su Mac)
npx cap add ios
```

### 3️⃣ Build e Sync

```bash
# 1. Build del progetto web
npm run build

# 2. Sincronizza con le piattaforme native
npx cap sync

# 3. Copia le icone e splash screen
npx cap copy
```

### 4️⃣ Apri nei Native IDE

**Per Android (Android Studio):**
```bash
npx cap open android
```

**Per iOS (Xcode - solo su Mac):**
```bash
npx cap open ios
```

## 📱 Build per Google Play Store

### Prerequisiti Android:
1. Installa [Android Studio](https://developer.android.com/studio)
2. Configura Android SDK (Android Studio lo fa automaticamente)

### Genera Keystore per Firma:

```bash
# Genera keystore (se non hai già android.keystore)
keytool -genkey -v -keystore android.keystore -alias plant-patho-pal -keyalg RSA -keysize 2048 -validity 10000
```

### Build APK/AAB in Android Studio:

1. Apri il progetto: `npx cap open android`
2. In Android Studio:
   - **Per testare**: Build → Build Bundle(s) / APK(s) → Build APK(s)
   - **Per pubblicare**: Build → Generate Signed Bundle / APK
3. Seleziona "Android App Bundle" (AAB) per Google Play
4. Inserisci i dati del keystore
5. Seleziona "release" build variant
6. Il file AAB sarà in: `android/app/release/app-release.aab`

### Pubblica su Google Play:

1. Vai su [Google Play Console](https://play.google.com/console)
2. Crea una nuova app
3. Compila tutte le informazioni richieste:
   - Descrizione app
   - Screenshot (usa varie dimensioni)
   - Privacy Policy URL
   - Categoria
4. Carica l'AAB in "Release di produzione"
5. Completa il modulo dei contenuti
6. Invia per revisione

## 🍎 Build per Apple App Store

### Prerequisiti iOS:
1. **Mac con Xcode** installato
2. **Apple Developer Account** ($99/anno)
3. Certificati e provisioning profiles configurati

### Build in Xcode:

1. Apri il progetto: `npx cap open ios`
2. In Xcode:
   - Seleziona il tuo team in "Signing & Capabilities"
   - Scegli "Any iOS Device (arm64)" come destinazione
   - Product → Archive
3. Quando l'archivio è pronto: Distribute App → App Store Connect
4. Segui la procedura guidata

### Pubblica su App Store:

1. Vai su [App Store Connect](https://appstoreconnect.apple.com)
2. Crea una nuova app
3. Compila le informazioni:
   - Descrizione
   - Screenshot (varie dimensioni)
   - Privacy Policy
   - Categoria
4. Seleziona la build caricata da Xcode
5. Invia per revisione

## 🔄 Aggiornamenti Futuri

Ogni volta che aggiorni il codice in Lovable:

```bash
# 1. Git pull delle modifiche
git pull

# 2. Reinstalla dipendenze (se necessario)
npm install

# 3. Rebuild
npm run build

# 4. Sync con piattaforme native
npx cap sync

# 5. Apri in IDE per testare
npx cap open android  # oppure ios
```

## 🎨 Personalizzare Icone e Splash Screen

Le icone e splash screen sono in:
- `/public/icon-512.png` - Icona principale
- `/public/icon-192.png` - Icona piccola
- `/public/splash-2732x2732.png` - Splash screen

Per cambiarle:
1. Sostituisci i file con le tue immagini
2. Esegui `npx cap sync`
3. Rebuild l'app

## ⚙️ Configurazioni Importanti

### capacitor.config.ts
- `appId`: Identificativo univoco dell'app (non modificare dopo pubblicazione!)
- `appName`: Nome visualizzato
- Configurazioni splash screen e notifiche

### manifest.json (PWA)
- Icone e configurazioni per installazione web
- Shortcuts e categorie app

## 🐛 Troubleshooting Comune

**Errore "SDK not found":**
```bash
# Imposta ANDROID_HOME
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

**Errore Gradle:**
```bash
cd android
./gradlew clean
cd ..
npx cap sync
```

**Icone non aggiornate:**
```bash
npx cap copy
npx cap sync
```

## 📚 Risorse Utili

- [Documentazione Capacitor](https://capacitorjs.com/docs)
- [Android Publishing Guide](https://developer.android.com/studio/publish)
- [iOS Publishing Guide](https://developer.apple.com/app-store/submitting/)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

## 🎯 Checklist Pre-Pubblicazione

### Android:
- [ ] Build AAB funzionante
- [ ] Keystore salvato in modo sicuro
- [ ] Screenshot preparati (phone, tablet, 7" e 10")
- [ ] Privacy Policy URL pronto
- [ ] Descrizione e metadata completati
- [ ] Icona conforme (512x512 PNG)

### iOS:
- [ ] Build Archive completato
- [ ] Certificati e provisioning profiles OK
- [ ] Screenshot preparati (varie dimensioni iPhone/iPad)
- [ ] Privacy Policy URL pronto
- [ ] Descrizione e metadata completati
- [ ] App Store Connect app creata

## ✨ Funzionalità Mobile Attive

L'app include già:
- 📷 **Camera API** per diagnosi piante
- 🔔 **Push Notifications** (configurare Firebase)
- 📳 **Haptic Feedback** 
- 🌐 **Offline support** (PWA)
- 🔒 **Secure storage**

---

**Nota**: La configurazione `server.url` in `capacitor.config.ts` è commentata per produzione. Per sviluppo con hot-reload, decommentala.
