
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ThemeMode = "light" | "dark";
type Language = "en" | "it" | "fr" | "es" | "de";

type ThemeContextType = {
  mode: ThemeMode;
  language: Language;
  setMode: (mode: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  translations: Record<string, Record<Language, string>>;
  t: (key: string) => string;
};

const defaultTranslations = {
  "settings": {
    "en": "Settings",
    "it": "Impostazioni",
    "fr": "Paramètres",
    "es": "Configuración",
    "de": "Einstellungen"
  },
  "appearance": {
    "en": "Appearance",
    "it": "Aspetto",
    "fr": "Apparence",
    "es": "Apariencia",
    "de": "Aussehen"
  },
  "darkMode": {
    "en": "Dark Mode",
    "it": "Modalità scura",
    "fr": "Mode sombre",
    "es": "Modo oscuro",
    "de": "Dunkelmodus"
  },
  "lightMode": {
    "en": "Light Mode",
    "it": "Modalità chiara",
    "fr": "Mode clair",
    "es": "Modo claro",
    "de": "Hellmodus"
  },
  "language": {
    "en": "Language",
    "it": "Lingua",
    "fr": "Langue",
    "es": "Idioma",
    "de": "Sprache"
  },
  "english": {
    "en": "English",
    "it": "Inglese",
    "fr": "Anglais",
    "es": "Inglés",
    "de": "Englisch"
  },
  "italian": {
    "en": "Italian",
    "it": "Italiano",
    "fr": "Italien",
    "es": "Italiano",
    "de": "Italienisch"
  },
  "french": {
    "en": "French",
    "it": "Francese",
    "fr": "Français",
    "es": "Francés",
    "de": "Französisch"
  },
  "spanish": {
    "en": "Spanish",
    "it": "Spagnolo",
    "fr": "Espagnol",
    "es": "Español",
    "de": "Spanisch"
  },
  "german": {
    "en": "German",
    "it": "Tedesco",
    "fr": "Allemand",
    "es": "Alemán",
    "de": "Deutsch"
  },
  "save": {
    "en": "Save",
    "it": "Salva",
    "fr": "Enregistrer",
    "es": "Guardar",
    "de": "Speichern"
  },
  "cancel": {
    "en": "Cancel",
    "it": "Annulla",
    "fr": "Annuler",
    "es": "Cancelar",
    "de": "Abbrechen"
  },
  "profile": {
    "en": "Profile",
    "it": "Profilo",
    "fr": "Profil",
    "es": "Perfil",
    "de": "Profil"
  },
  "signOut": {
    "en": "Sign Out",
    "it": "Disconnettersi",
    "fr": "Se déconnecter",
    "es": "Cerrar sesión",
    "de": "Abmelden"
  },
  "changeUsername": {
    "en": "Change Username",
    "it": "Cambia nome utente",
    "fr": "Changer de nom d'utilisateur",
    "es": "Cambiar nombre de usuario",
    "de": "Benutzernamen ändern"
  },
  "changePassword": {
    "en": "Change Password",
    "it": "Cambia password",
    "fr": "Changer le mot de passe",
    "es": "Cambiar contraseña",
    "de": "Passwort ändern"
  },
  "currentUsername": {
    "en": "Current Username",
    "it": "Nome utente attuale",
    "fr": "Nom d'utilisateur actuel",
    "es": "Nombre de usuario actual",
    "de": "Aktueller Benutzername"
  },
  "newUsername": {
    "en": "New Username",
    "it": "Nuovo nome utente",
    "fr": "Nouveau nom d'utilisateur",
    "es": "Nuevo nombre de usuario",
    "de": "Neuer Benutzername"
  },
  "currentPassword": {
    "en": "Current Password",
    "it": "Password attuale",
    "fr": "Mot de passe actuel",
    "es": "Contraseña actual",
    "de": "Aktuelles Passwort"
  },
  "newPassword": {
    "en": "New Password",
    "it": "Nuova password",
    "fr": "Nouveau mot de passe",
    "es": "Nueva contraseña",
    "de": "Neues Passwort"
  },
  "confirmPassword": {
    "en": "Confirm Password",
    "it": "Conferma password",
    "fr": "Confirmer le mot de passe",
    "es": "Confirmar contraseña",
    "de": "Passwort bestätigen"
  },
  "privacyPolicy": {
    "en": "Privacy Policy",
    "it": "Politica sulla privacy",
    "fr": "Politique de confidentialité",
    "es": "Política de privacidad",
    "de": "Datenschutzrichtlinie"
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
    return (savedLanguage as Language) || "en";
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

  // Translation function
  const t = (key: string) => {
    return defaultTranslations[key]?.[language] || key;
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
