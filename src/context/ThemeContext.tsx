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

// Traduzioni (troncate per brevità)
const translations = {
  it: { uploadImage: "Carica immagine", noPlantDetected: "Nessuna pianta rilevata nell'immagine", plantDetected: "Pianta rilevata nell'immagine", analyzing: "Analizzando..." },
  en: { uploadImage: "Upload image", noPlantDetected: "No plant detected in the image", plantDetected: "Plant detected in the image", analyzing: "Analyzing..." }
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState<'it' | 'en'>('it');

  useEffect(() => {
    const storedMode = localStorage.getItem('themeMode') as 'light' | 'dark' | null;
    const storedLanguage = localStorage.getItem('language') as 'it' | 'en' | null;
    if (storedMode) setMode(storedMode);
    if (storedLanguage) setLanguage(storedLanguage);
  }, []);

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => translations[language][key] || key;

  return (
    <ThemeContext.Provider value={{ mode, setMode, language, setLanguage, t }}>
      {children}
      <PlantImageUploader t={t} />
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

// Componente integrato per caricamento e verifica immagine
const PlantImageUploader: React.FC<{ t: (key: string) => string }> = ({ t }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const isPlantImage = async (file: File): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Chiamata API a Plant.id o servizio simile
      const response = await fetch('https://api.plant.id/v2/identify', {
        method: 'POST',
        headers: {
          'Api-Key': 'K89074639088957'
        },
        body: formData,
      });

      const data = await response.json();

      // Controlla se la probabilità che sia una pianta è alta
      const suggestions = data?.suggestions || [];
      if (suggestions.length > 0) {
        const probability = suggestions[0].probability;
        return probability > 0.7; // soglia 70%
      }

      return false;
    } catch (error) {
      console.error('Errore nella verifica immagine', error);
      return false;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setLoading(true);
    const validPlant = await isPlantImage(selectedFile);
    setLoading(false);

    if (!validPlant) {
      setError(t('noPlantDetected'));
      setFile(null);
    } else {
      setFile(selectedFile);
    }
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <label style={{ fontWeight: 'bold' }}>{t('uploadImage')}</label>
      <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} />
      {loading && <p>{t('analyzing')}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {file && <p style={{ color: 'green' }}>{t('plantDetected')}</p>}
      {file && <img src={URL.createObjectURL(file)} alt="preview" style={{ maxWidth: '200px', marginTop: '10px' }} />}
    </div>
  );
};
