
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ThemeMode = "light" | "dark";
type Language = "en" | "it";

type ThemeContextType = {
  mode: ThemeMode;
  language: Language;
  setMode: (mode: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  translations: Record<string, Record<Language, string>>;
  t: (key: string, params?: Record<string, string>) => string;
};

const defaultTranslations = {
  // Autenticazione
  "welcome": {
    "en": "Welcome",
    "it": "Benvenuto"
  },
  "login": {
    "en": "Login",
    "it": "Accedi"
  },
  "signup": {
    "en": "Sign Up",
    "it": "Registrati"
  },
  "email": {
    "en": "Email",
    "it": "Email"
  },
  "password": {
    "en": "Password",
    "it": "Password"
  },
  "enterEmail": {
    "en": "Enter your email",
    "it": "Inserisci la tua email"
  },
  "enterPassword": {
    "en": "Enter your password",
    "it": "Inserisci la tua password"
  },
  "loginInProgress": {
    "en": "Logging in...",
    "it": "Accesso in corso..."
  },
  "loginSuccessful": {
    "en": "Login successful",
    "it": "Login effettuato con successo"
  },
  "loginFailed": {
    "en": "Login failed",
    "it": "Login fallito"
  },
  "noAccount": {
    "en": "Don't have an account?",
    "it": "Non hai un account?"
  },
  "hasAccount": {
    "en": "Already have an account?",
    "it": "Hai già un account?"
  },
  "chooseLanguage": {
    "en": "Choose Language",
    "it": "Scegli Lingua"
  },
  "language": {
    "en": "Language",
    "it": "Lingua"
  },
  "english": {
    "en": "English",
    "it": "Inglese"
  },
  "italian": {
    "en": "Italian",
    "it": "Italiano"
  },
  
  // Navigazione
  "home": {
    "en": "Home",
    "it": "Home"
  },
  "diagnose": {
    "en": "Diagnose",
    "it": "Diagnosi"
  },
  "chat": {
    "en": "Chat",
    "it": "Chat"
  },
  "library": {
    "en": "Library",
    "it": "Libreria"
  },
  "shop": {
    "en": "Shop",
    "it": "Negozio"
  },
  "profile": {
    "en": "Profile",
    "it": "Profilo"
  },
  "dashboard": {
    "en": "Dashboard",
    "it": "Dashboard"
  },
  
  // Diagnosi
  "plantDiagnosis": {
    "en": "Plant Disease Diagnosis",
    "it": "Diagnosi Malattie delle Piante"
  },
  "takePicture": {
    "en": "Take Picture",
    "it": "Scatta Foto"
  },
  "uploadImage": {
    "en": "Upload Image",
    "it": "Carica Immagine"
  },
  "analyzeWithAI": {
    "en": "Analyze with AI",
    "it": "Analizza con IA"
  },
  "sendToExpert": {
    "en": "Send to Expert",
    "it": "Invia all'Esperto"
  },
  "analyzing": {
    "en": "Analyzing...",
    "it": "Analizzando..."
  },
  "uploadPhoto": {
    "en": "Upload a photo of your plant",
    "it": "Carica una foto della tua pianta"
  },
  "chooseAnalysis": {
    "en": "Choose your analysis type",
    "it": "Scegli il tipo di analisi"
  },
  
  // Chat
  "typeMessage": {
    "en": "Type your message...",
    "it": "Scrivi il tuo messaggio..."
  },
  "sendMessage": {
    "en": "Send Message",
    "it": "Invia Messaggio"
  },
  "expertConsultation": {
    "en": "Expert Consultation",
    "it": "Consulenza Esperta"
  },
  "chatWithExperts": {
    "en": "Chat with Experts",
    "it": "Chatta con gli Esperti"
  },
  "onlineExperts": {
    "en": "Online Experts",
    "it": "Esperti Online"
  },
  "noMessages": {
    "en": "No messages yet",
    "it": "Nessun messaggio ancora"
  },
  "conversationBlocked": {
    "en": "This user is blocked. Unblock to continue.",
    "it": "Questo utente è bloccato. Sblocca per continuare."
  },
  
  // Dashboard Esperto
  "clientConversations": {
    "en": "Client Conversations",
    "it": "Conversazioni Clienti"
  },
  "activeConversations": {
    "en": "active conversations",
    "it": "conversazioni attive"
  },
  "loadingConversations": {
    "en": "Loading conversations...",
    "it": "Caricamento conversazioni..."
  },
  "noActiveConversations": {
    "en": "No active conversations",
    "it": "Nessuna conversazione attiva"
  },
  "selectConversation": {
    "en": "Select a Conversation",
    "it": "Seleziona una Conversazione"
  },
  "chooseConversation": {
    "en": "Choose a conversation from the list to start chatting with your patients.",
    "it": "Scegli una conversazione dalla lista per iniziare a chattare con i tuoi pazienti."
  },
  "chatWith": {
    "en": "Chat with",
    "it": "Chat con"
  },
  "activeConversation": {
    "en": "Active Conversation",
    "it": "Conversazione Attiva"
  },
  "online": {
    "en": "Online",
    "it": "Online"
  },
  "offline": {
    "en": "Offline",
    "it": "Offline"
  },
  "connected": {
    "en": "Connected",
    "it": "Connesso"
  },
  "disconnected": {
    "en": "Disconnected",
    "it": "Disconnesso"
  },
  "deleteChat": {
    "en": "Delete Chat",
    "it": "Elimina Chat"
  },
  "deleteConversation": {
    "en": "Delete Conversation",
    "it": "Elimina Conversazione"
  },
  "confirmDeleteConversation": {
    "en": "Are you sure you want to delete this conversation? All messages will be permanently deleted.",
    "it": "Sei sicuro di voler eliminare questa conversazione? Tutti i messaggi verranno eliminati permanentemente."
  },
  "cancel": {
    "en": "Cancel",
    "it": "Annulla"
  },
  "delete": {
    "en": "Delete",
    "it": "Elimina"
  },
  "conversationDeleted": {
    "en": "Conversation Deleted",
    "it": "Conversazione Eliminata"
  },
  "conversationNotAvailable": {
    "en": "Conversation no longer available",
    "it": "Conversazione non più disponibile"
  },
  "conversationDeletedDescription": {
    "en": "This conversation has been deleted and is no longer accessible. All interactions with this conversation have been disabled.",
    "it": "Questa conversazione è stata eliminata e non è più accessibile. Tutte le interazioni con questa conversazione sono state disabilitate."
  },
  "selectAnotherConversation": {
    "en": "Select another conversation",
    "it": "Seleziona un'altra conversazione"
  },
  "conversationNotFound": {
    "en": "Conversation Not Found",
    "it": "Conversazione Non Trovata"
  },
  "noConversationFound": {
    "en": "No conversation found for this user.",
    "it": "Nessuna conversazione trovata per questo utente."
  },
  
  // Profilo
  "completeProfile": {
    "en": "Complete your profile",
    "it": "Completa il tuo profilo"
  },
  "personalInfo": {
    "en": "Enter your information to personalize your experience",
    "it": "Inserisci le tue informazioni per personalizzare la tua esperienza"
  },
  "firstName": {
    "en": "First Name",
    "it": "Nome"
  },
  "lastName": {
    "en": "Last Name",
    "it": "Cognome"
  },
  "birthDate": {
    "en": "Birth Date",
    "it": "Data di nascita"
  },
  "birthPlace": {
    "en": "Birth Place",
    "it": "Luogo di nascita"
  },
  "enterFirstName": {
    "en": "Enter your first name",
    "it": "Inserisci il tuo nome"
  },
  "enterLastName": {
    "en": "Enter your last name",
    "it": "Inserisci il tuo cognome"
  },
  "enterBirthDate": {
    "en": "Enter your birth date",
    "it": "Inserisci la tua data di nascita"
  },
  "enterBirthPlace": {
    "en": "Enter your birth place",
    "it": "Inserisci il tuo luogo di nascita"
  },
  "continue": {
    "en": "Continue",
    "it": "Continua"
  },
  "saving": {
    "en": "Saving...",
    "it": "Salvataggio..."
  },
  "profileCompleted": {
    "en": "Profile completed",
    "it": "Profilo completato"
  },
  "welcomeMessage": {
    "en": "Welcome to Dr.Plant!",
    "it": "Benvenuto su Dr.Plant!"
  },
  "signOut": {
    "en": "Sign Out",
    "it": "Disconnetti"
  },
  
  // Impostazioni
  "settings": {
    "en": "Settings",
    "it": "Impostazioni"
  },
  "appearance": {
    "en": "Appearance",
    "it": "Aspetto"
  },
  "lightMode": {
    "en": "Light Mode",
    "it": "Modalità Chiara"
  },
  "darkMode": {
    "en": "Dark Mode",
    "it": "Modalità Scura"
  },
  "save": {
    "en": "Save",
    "it": "Salva"
  },
  "settingsSaved": {
    "en": "Settings saved",
    "it": "Impostazioni salvate"
  },
  "preferencesUpdated": {
    "en": "Your preferences have been updated",
    "it": "Le tue preferenze sono state aggiornate"
  },
  
  // Messaggi di errore e successo
  "error": {
    "en": "Error",
    "it": "Errore"
  },
  "success": {
    "en": "Success",
    "it": "Successo"
  },
  "loading": {
    "en": "Loading...",
    "it": "Caricamento..."
  },
  "tryAgain": {
    "en": "Try again",
    "it": "Riprova"
  },
  "somethingWentWrong": {
    "en": "Something went wrong",
    "it": "Qualcosa è andato storto"
  },
  "accessDenied": {
    "en": "Access denied. Only Marco Nigro can access this section.",
    "it": "Accesso negato. Solo Marco Nigro può accedere a questa sezione."
  },
  "completeDiagnosisFirst": {
    "en": "Complete the plant diagnosis first!",
    "it": "Completa prima la diagnosi della pianta!"
  },
  "afterUploadChoose": {
    "en": "After uploading the photo, choose between AI Analysis or send to expert.",
    "it": "Dopo il caricamento della foto, scegli tra Analisi AI o invio all'esperto."
  },
  "accessNotAllowed": {
    "en": "Access not allowed",
    "it": "Accesso non consentito"
  },
  "useExpertDashboard": {
    "en": "Use the expert dashboard to manage conversations.",
    "it": "Usa la dashboard esperto per gestire le conversazioni."
  },
  
  // Pagine pubbliche
  "aboutUs": {
    "en": "About Us",
    "it": "Chi Siamo"
  },
  "services": {
    "en": "Services",
    "it": "Servizi"
  },
  "contact": {
    "en": "Contact",
    "it": "Contatti"
  },
  "ourMission": {
    "en": "Our Mission",
    "it": "La Nostra Missione"
  },
  "missionDescription": {
    "en": "At DR PLANT, our mission is to revolutionize plant health care through accessible technology. We aim to empower gardeners, farmers, and plant enthusiasts worldwide by providing instant, accurate disease diagnosis and expert support.",
    "it": "In DR PLANT, la nostra missione è rivoluzionare la cura della salute delle piante attraverso tecnologia accessibile. Miriamo a dare potere a giardinieri, agricoltori e appassionati di piante in tutto il mondo fornendo diagnosi istantanee e accurate delle malattie e supporto esperto."
  },
  "ourTeam": {
    "en": "Our Team",
    "it": "Il Nostro Team"
  },
  "teamDescription": {
    "en": "Our team consists of experienced plant pathologists, agronomists, and technology experts dedicated to combining scientific knowledge with cutting-edge AI technology.",
    "it": "Il nostro team è composto da esperti patologi vegetali, agronomi ed esperti di tecnologia dedicati a combinare conoscenze scientifiche con tecnologia AI all'avanguardia."
  },
  "ourImpact": {
    "en": "Our Impact",
    "it": "Il Nostro Impatto"
  },
  "impactDescription": {
    "en": "DR PLANT has helped thousands of users across the globe identify and treat plant diseases, contributing to healthier gardens and more sustainable farming practices.",
    "it": "DR PLANT ha aiutato migliaia di utenti in tutto il mondo a identificare e trattare malattie delle piante, contribuendo a giardini più sani e pratiche agricole più sostenibili."
  },
  "ourServices": {
    "en": "Our Services",
    "it": "I Nostri Servizi"
  },
  "servicesIntro": {
    "en": "We offer comprehensive plant health solutions powered by AI technology and backed by expert knowledge.",
    "it": "Offriamo soluzioni complete per la salute delle piante alimentate dalla tecnologia AI e supportate da conoscenze specialistiche."
  },
  "plantDiagnosisDesc": {
    "en": "Our advanced AI system analyzes plant photos to identify diseases and provide accurate treatment recommendations.",
    "it": "Il nostro sistema AI avanzato analizza le foto delle piante per identificare le malattie e fornire raccomandazioni di trattamento accurate."
  },
  "expertConsultationDesc": {
    "en": "Connect with plant experts for personalized advice on complex plant health issues and care recommendations.",
    "it": "Connettiti con esperti di piante per consigli personalizzati su problemi complessi di salute delle piante e raccomandazioni di cura."
  },
  "plantCareShop": {
    "en": "Plant Care Shop",
    "it": "Negozio per la Cura delle Piante"
  },
  "plantCareShopDesc": {
    "en": "Browse our curated selection of plant care products, treatments, and gardening essentials for healthier plants.",
    "it": "Sfoglia la nostra selezione curata di prodotti per la cura delle piante, trattamenti e prodotti essenziali per il giardinaggio per piante più sane."
  },
  "plantCareLibrary": {
    "en": "Plant Care Library",
    "it": "Biblioteca per la Cura delle Piante"
  },
  "plantCareLibraryDesc": {
    "en": "Access comprehensive guides, tips, and best practices for maintaining healthy plants and preventing diseases.",
    "it": "Accedi a guide complete, consigli e migliori pratiche per mantenere piante sane e prevenire malattie."
  },
  "premiumServices": {
    "en": "Premium Services",
    "it": "Servizi Premium"
  },
  "premiumServicesDesc": {
    "en": "For commercial growers and serious enthusiasts, we offer specialized premium services with personalized support.",
    "it": "Per coltivatori commerciali e appassionati seri, offriamo servizi premium specializzati con supporto personalizzato."
  },
  "contactForPremium": {
    "en": "Contact Us for Premium Services",
    "it": "Contattaci per Servizi Premium"
  },
  
  // Copyright
  "allRightsReserved": {
    "en": "All rights reserved.",
    "it": "Tutti i diritti riservati."
  },
  "assistantMessage": {
    "en": "Access your plant care assistant",
    "it": "Accedi al tuo assistente per la cura delle piante"
  },
  "enterCredentials": {
    "en": "Enter your credentials to continue",
    "it": "Inserisci le tue credenziali per continuare"
  },
  "adminAccountDetected": {
    "en": "Administrator account detected",
    "it": "Account amministratore rilevato"
  },
  "checkEmailConfirmation": {
    "en": "Check your email",
    "it": "Controlla la tua email"
  },
  "confirmationEmailSent": {
    "en": "We have sent a confirmation email to",
    "it": "Abbiamo inviato un'email di conferma a"
  },
  "clickLinkToComplete": {
    "en": "Click the link in the email to complete your registration.",
    "it": "Clicca sul link nell'email per completare la registrazione."
  },
  "didntReceiveEmail": {
    "en": "Didn't receive the email?",
    "it": "Non hai ricevuto l'email?"
  },
  "checkSpamFolder": {
    "en": "Check your spam or junk folder.",
    "it": "Controlla nella cartella spam o nella posta indesiderata."
  },
  "goToLogin": {
    "en": "Go to Login",
    "it": "Vai al Login"
  },
  "registerAnotherAccount": {
    "en": "Register another account",
    "it": "Registra un altro account"
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem("theme-mode");
    return (savedMode as ThemeMode) || "light";
  });
  
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("app-language");
    return (savedLanguage as Language) || "it"; // Default to Italian
  });

  useEffect(() => {
    localStorage.setItem("theme-mode", mode);
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("app-language", language);
  }, [language]);

  const t = (key: string, params?: Record<string, string>) => {
    let translatedText = defaultTranslations[key]?.[language] || key;
    
    if (params) {
      Object.keys(params).forEach(param => {
        translatedText = translatedText.replace(`{${param}}`, params[param]);
      });
    }
    
    return translatedText;
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        language,
        setMode,
        setLanguage,
        translations: defaultTranslations,
        t
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
