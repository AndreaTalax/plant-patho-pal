import { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextProps {
  mode: 'light' | 'dark';
  setMode: (mode: 'light' | 'dark') => void;
  language: 'it' | 'en';
  setLanguage: (language: 'it' | 'en') => void;
  t: (key: string) => string;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

const translations = {
  it: {
    appName: "Dr.Plant",
    assistantMessage: "Il tuo assistente personale per la cura delle piante",
    welcome: "Bentornato!",
    enterCredentials: "Inserisci le tue credenziali per accedere",
    email: "Email",
    enterEmail: "Inserisci la tua email",
    password: "Password",
    enterPassword: "Inserisci la tua password",
    login: "Accedi",
    loginInProgress: "Accesso in corso...",
    loginSuccessful: "Accesso eseguito con successo!",
    welcomeMessage: "Benvenuto nel tuo account!",
    loginFailed: "Accesso fallito",
    somethingWentWrong: "Qualcosa è andato storto. Riprova.",
    noAccount: "Non hai un account?",
    signup: "Registrati",
    allRightsReserved: "Tutti i diritti riservati.",
    language: "Lingua",
    italian: "Italiano",
    english: "Inglese",
    error: "Errore!",
    profile: "Profilo",
    library: "Libreria",
    shop: "Negozio",
    diagnose: "Diagnosi",
    dashboard: "Dashboard",
    settings: "Impostazioni",
    appearance: "Aspetto",
    darkMode: "Modalità scura",
    lightMode: "Modalità chiara",
    cancel: "Annulla",
    save: "Salva",
    settingsSaved: "Impostazioni salvate!",
    preferencesUpdated: "Le tue preferenze sono state aggiornate.",
    logout: "Esci",
    logoutConfirmation: "Sei sicuro di voler uscire?",
    confirm: "Conferma",
    completeProfile: "Completa il tuo profilo",
    personalInfo: "Inserisci le tue informazioni personali per continuare.",
    firstName: "Nome",
    lastName: "Cognome",
    birthDate: "Data di nascita",
    birthPlace: "Luogo di nascita",
    enterFirstName: "Inserisci il tuo nome",
    enterLastName: "Inserisci il tuo cognome",
    enterBirthDate: "Inserisci la tua data di nascita",
    enterBirthPlace: "Inserisci il tuo luogo di nascita",
    saving: "Salvataggio...",
    continue: "Continua",
    profileCompleted: "Profilo completato!",
    tryAgain: "Per favore, riprova.",
    uploadImage: "Carica immagine",
    plantName: "Nome della pianta",
    addPlantName: "Aggiungi il nome della tua pianta",
    optional: "Opzionale",
    plantDetails: "Dettagli della pianta",
    useAI: "Usa l'AI per la diagnosi",
    sendToExpert: "Invia ad un esperto",
    additionalNotes: "Note aggiuntive",
    addAdditionalNotes: "Aggiungi note aggiuntive per la diagnosi",
    uploading: "Caricamento...",
    confirmAndSend: "Conferma e Invia",
    diagnosisInProgress: "Diagnosi in corso...",
    diagnosisResults: "Risultati della diagnosi",
    possibleDiseases: "Possibili malattie",
    treatmentRecommendations: "Raccomandazioni di trattamento",
    expertAnalysis: "Analisi dell'esperto",
    expertWillContact: "Un nostro esperto ti contatterà presto.",
    backToDiagnosis: "Torna alla diagnosi",
    completeDiagnosisFirst: "Completa prima la diagnosi!",
    afterUploadChoose: "Dopo aver caricato la foto, scegli se usare l'AI o inviare ad un esperto.",
    adminAccountDetected: "Hai effettuato l'accesso con un account amministratore.",
    forgotPassword: "Password dimenticata?",
    forgotPasswordDescription: "Inserisci il tuo indirizzo email e ti invieremo un link per reimpostare la password.",
    resetPassword: "Reimposta Password",
    newPassword: "Nuova Password",
    confirmPassword: "Conferma Password",
    enterNewPassword: "Inserisci la nuova password",
    confirmNewPassword: "Conferma la nuova password",
    sendResetEmail: "Invia Email di Reset",
    resetEmailSent: "Email di reset inviata!",
    checkEmailForReset: "Controlla la tua email per il link di reset della password.",
    checkEmailInbox: "Controlla la tua casella di posta e segui le istruzioni.",
    emailSentDescription: "Ti abbiamo inviato un'email con le istruzioni per reimpostare la password.",
    passwordResetSuccess: "Password reimpostata con successo!",
    passwordUpdatedSuccess: "La tua password è stata aggiornata correttamente.",
    passwordUpdatedRedirect: "Verrai reindirizzato alla pagina di login tra poco.",
    invalidResetLink: "Link di reset non valido o scaduto.",
    fillAllFields: "Compila tutti i campi richiesti.",
    passwordsDontMatch: "Le password non corrispondono.",
    passwordTooShort: "La password deve contenere almeno 6 caratteri.",
    updatePassword: "Aggiorna Password",
    updating: "Aggiornamento...",
    sending: "Invio...",
    close: "Chiudi",
    back: "Indietro",
    notifications: "Notifiche",
    pushNotifications: "Notifiche Push",
    testNotification: "Testa Notifica",
    pushNotificationsEnabled: "Le notifiche push sono attivate. Riceverai notifiche per i nuovi messaggi.",
    pushNotificationsDenied: "Le notifiche push sono state negate. Puoi riattivarle dalle impostazioni del browser.",
    pushNotificationsDisabled: "Attiva le notifiche push per ricevere avvisi sui nuovi messaggi.",
    pushNotificationsNotSupported: "Le notifiche push non sono supportate su questo dispositivo.",
  },
  en: {
    appName: "Dr.Plant",
    assistantMessage: "Your personal plant care assistant",
    welcome: "Welcome Back!",
    enterCredentials: "Enter your credentials to access",
    email: "Email",
    enterEmail: "Enter your email",
    password: "Password",
    enterPassword: "Enter your password",
    login: "Login",
    loginInProgress: "Logging in...",
    loginSuccessful: "Login successful!",
    welcomeMessage: "Welcome to your account!",
    loginFailed: "Login failed",
    somethingWentWrong: "Something went wrong. Please try again.",
    noAccount: "Don't have an account?",
    signup: "Sign up",
    allRightsReserved: "All rights reserved.",
    language: "Language",
    italian: "Italian",
    english: "English",
    error: "Error!",
    profile: "Profile",
    library: "Library",
    shop: "Shop",
    diagnose: "Diagnose",
    dashboard: "Dashboard",
    settings: "Settings",
    appearance: "Appearance",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    cancel: "Cancel",
    save: "Save",
    settingsSaved: "Settings saved!",
    preferencesUpdated: "Your preferences have been updated.",
    logout: "Logout",
    logoutConfirmation: "Are you sure you want to logout?",
    confirm: "Confirm",
    completeProfile: "Complete Your Profile",
    personalInfo: "Enter your personal information to continue.",
    firstName: "First Name",
    lastName: "Last Name",
    birthDate: "Birth Date",
    birthPlace: "Birth Place",
    enterFirstName: "Enter your first name",
    enterLastName: "Enter your last name",
    enterBirthDate: "Enter your birth date",
    enterBirthPlace: "Enter your birth place",
    saving: "Saving...",
    continue: "Continue",
    profileCompleted: "Profile Completed!",
    tryAgain: "Please, try again.",
    uploadImage: "Upload image",
    plantName: "Plant name",
    addPlantName: "Add your plant name",
    optional: "Optional",
    plantDetails: "Plant details",
    useAI: "Use AI for diagnosis",
    sendToExpert: "Send to an expert",
    additionalNotes: "Additional notes",
    addAdditionalNotes: "Add additional notes for diagnosis",
    uploading: "Uploading...",
    confirmAndSend: "Confirm and Send",
    diagnosisInProgress: "Diagnosis in progress...",
    diagnosisResults: "Diagnosis results",
    possibleDiseases: "Possible diseases",
    treatmentRecommendations: "Treatment recommendations",
    expertAnalysis: "Expert analysis",
    expertWillContact: "Our expert will contact you soon.",
    backToDiagnosis: "Back to diagnosis",
    completeDiagnosisFirst: "Complete the diagnosis first!",
    afterUploadChoose: "After uploading the photo, choose whether to use AI or send it to an expert.",
    adminAccountDetected: "You have logged in with an administrator account.",
    forgotPassword: "Forgot Password?",
    forgotPasswordDescription: "Enter your email address and we'll send you a link to reset your password.",
    resetPassword: "Reset Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    enterNewPassword: "Enter new password",
    confirmNewPassword: "Confirm new password",
    sendResetEmail: "Send Reset Email",
    resetEmailSent: "Reset email sent!",
    checkEmailForReset: "Check your email for the password reset link.",
    checkEmailInbox: "Check your inbox and follow the instructions.",
    emailSentDescription: "We've sent you an email with instructions to reset your password.",
    passwordResetSuccess: "Password reset successfully!",
    passwordUpdatedSuccess: "Your password has been updated successfully.",
    passwordUpdatedRedirect: "You will be redirected to the login page shortly.",
    invalidResetLink: "Invalid or expired reset link.",
    fillAllFields: "Fill in all required fields.",
    passwordsDontMatch: "Passwords don't match.",
    passwordTooShort: "Password must be at least 6 characters long.",
    updatePassword: "Update Password",
    updating: "Updating...",
    sending: "Sending...",
    close: "Close",
    back: "Back",
  }
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'it' | 'en'>('it');

  useEffect(() => {
    const storedMode = localStorage.getItem('themeMode') as 'light' | 'dark' | null;
    const storedLanguage = localStorage.getItem('language') as 'it' | 'en' | null;
    
    if (storedMode) {
      setMode(storedMode);
    }
    if (storedLanguage) {
      setLanguage(storedLanguage);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <ThemeContext.Provider value={{ mode, setMode, language, setLanguage, t }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
