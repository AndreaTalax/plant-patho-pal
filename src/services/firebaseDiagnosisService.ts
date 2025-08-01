import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';

// Firebase configuration
const firebaseConfig = {
  // Queste saranno configurate tramite Supabase secrets per sicurezza
  apiKey: "AIzaSyDummy", // Verrà sostituita dalle env vars
  authDomain: "plant-patho-pal.firebaseapp.com",
  projectId: "plant-patho-pal",
  storageBucket: "plant-patho-pal.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export interface FirebaseDiagnosisResult {
  id?: string;
  timestamp: string;
  plantName: string;
  scientificName?: string;
  confidence: number;
  isHealthy: boolean;
  issues: Array<{
    name: string;
    type: string;
    severity: string;
    confidence: number;
    description: string;
    treatment: string[];
  }>;
  imageUrl?: string;
  userId?: string;
  analysisSource: string;
  processingTime: number;
  crossValidation?: {
    plantId?: any;
    eppo?: any;
    openai?: any;
  };
}

export class FirebaseDiagnosisService {
  
  /**
   * Salva il risultato della diagnosi su Firebase per backup e analisi
   */
  static async saveDiagnosisResult(
    diagnosisResult: any, 
    imageFile?: File, 
    userId?: string
  ): Promise<string | null> {
    try {
      console.log('💾 Salvando diagnosi su Firebase...');
      
      let imageUrl: string | undefined;
      
      // Upload dell'immagine su Firebase Storage (se fornita)
      if (imageFile) {
        try {
          const imageRef = ref(storage, `diagnoses/${Date.now()}_${imageFile.name}`);
          const snapshot = await uploadBytes(imageRef, imageFile);
          imageUrl = await getDownloadURL(snapshot.ref);
          console.log('📷 Immagine caricata su Firebase Storage');
        } catch (error) {
          console.warn('⚠️ Errore upload immagine Firebase:', error);
          // Continua senza immagine se fallisce l'upload
        }
      }
      
      const firebaseData: FirebaseDiagnosisResult = {
        timestamp: new Date().toISOString(),
        plantName: diagnosisResult.plantIdentification?.name || 'Sconosciuta',
        scientificName: diagnosisResult.plantIdentification?.scientificName,
        confidence: diagnosisResult.plantIdentification?.confidence || 0,
        isHealthy: diagnosisResult.healthAnalysis?.isHealthy || true,
        issues: diagnosisResult.healthAnalysis?.issues || [],
        imageUrl,
        userId,
        analysisSource: diagnosisResult.analysisDetails?.source || 'Enhanced AI',
        processingTime: diagnosisResult.analysisDetails?.processingTime || 0,
        crossValidation: diagnosisResult.crossValidation
      };
      
      const docRef = await addDoc(collection(db, 'plant_diagnoses'), firebaseData);
      console.log('✅ Diagnosi salvata su Firebase con ID:', docRef.id);
      
      return docRef.id;
      
    } catch (error) {
      console.error('❌ Errore salvataggio Firebase:', error);
      // Non bloccare l'applicazione se Firebase fallisce
      return null;
    }
  }
  
  /**
   * Recupera diagnosi precedenti dell'utente
   */
  static async getUserDiagnoses(userId: string, limitResults = 10): Promise<FirebaseDiagnosisResult[]> {
    try {
      console.log('📖 Recuperando diagnosi precedenti da Firebase...');
      
      const q = query(
        collection(db, 'plant_diagnoses'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitResults)
      );
      
      const querySnapshot = await getDocs(q);
      const diagnoses: FirebaseDiagnosisResult[] = [];
      
      querySnapshot.forEach((doc) => {
        diagnoses.push({
          id: doc.id,
          ...doc.data()
        } as FirebaseDiagnosisResult);
      });
      
      console.log(`📊 Recuperate ${diagnoses.length} diagnosi precedenti`);
      return diagnoses;
      
    } catch (error) {
      console.error('❌ Errore recupero diagnosi Firebase:', error);
      return [];
    }
  }
  
  /**
   * Cerca diagnosi simili nel database per migliorare l'accuratezza
   */
  static async findSimilarDiagnoses(plantName: string, limitResults = 5): Promise<FirebaseDiagnosisResult[]> {
    try {
      console.log('🔍 Cercando diagnosi simili per:', plantName);
      
      const q = query(
        collection(db, 'plant_diagnoses'),
        where('plantName', '==', plantName),
        orderBy('confidence', 'desc'),
        limit(limitResults)
      );
      
      const querySnapshot = await getDocs(q);
      const similarDiagnoses: FirebaseDiagnosisResult[] = [];
      
      querySnapshot.forEach((doc) => {
        similarDiagnoses.push({
          id: doc.id,
          ...doc.data()
        } as FirebaseDiagnosisResult);
      });
      
      console.log(`🎯 Trovate ${similarDiagnoses.length} diagnosi simili`);
      return similarDiagnoses;
      
    } catch (error) {
      console.error('❌ Errore ricerca diagnosi simili:', error);
      return [];
    }
  }
  
  /**
   * Ottieni statistiche aggregate per migliorare il servizio
   */
  static async getDiagnosisStats(): Promise<{
    totalDiagnoses: number;
    topPlants: string[];
    commonIssues: string[];
    averageConfidence: number;
  } | null> {
    try {
      console.log('📈 Recuperando statistiche diagnosi...');
      
      const querySnapshot = await getDocs(collection(db, 'plant_diagnoses'));
      
      if (querySnapshot.empty) {
        return {
          totalDiagnoses: 0,
          topPlants: [],
          commonIssues: [],
          averageConfidence: 0
        };
      }
      
      const plantCounts: { [key: string]: number } = {};
      const issueCounts: { [key: string]: number } = {};
      let totalConfidence = 0;
      let totalDiagnoses = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as FirebaseDiagnosisResult;
        totalDiagnoses++;
        totalConfidence += data.confidence;
        
        // Conta le piante
        if (data.plantName) {
          plantCounts[data.plantName] = (plantCounts[data.plantName] || 0) + 1;
        }
        
        // Conta i problemi
        data.issues.forEach(issue => {
          issueCounts[issue.name] = (issueCounts[issue.name] || 0) + 1;
        });
      });
      
      const topPlants = Object.entries(plantCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([plant]) => plant);
      
      const commonIssues = Object.entries(issueCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([issue]) => issue);
      
      const stats = {
        totalDiagnoses,
        topPlants,
        commonIssues,
        averageConfidence: Math.round(totalConfidence / totalDiagnoses)
      };
      
      console.log('📊 Statistiche calcolate:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ Errore calcolo statistiche:', error);
      return null;
    }
  }
  
  /**
   * Sistema di feedback per migliorare l'accuratezza
   */
  static async submitFeedback(
    diagnosisId: string, 
    isAccurate: boolean, 
    userCorrections?: {
      correctPlantName?: string;
      correctIssues?: string[];
      additionalNotes?: string;
    }
  ): Promise<boolean> {
    try {
      console.log('💬 Inviando feedback per diagnosi:', diagnosisId);
      
      const feedbackData = {
        diagnosisId,
        isAccurate,
        userCorrections,
        timestamp: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'diagnosis_feedback'), feedbackData);
      
      toast.success('Grazie per il feedback!', {
        description: 'Il tuo feedback ci aiuta a migliorare il servizio'
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ Errore invio feedback:', error);
      toast.error('Errore invio feedback');
      return false;
    }
  }
  
  /**
   * Cerca nel database locale prima di chiamare le API esterne (per ottimizzare performance)
   */
  static async searchLocalDatabase(
    plantName: string, 
    imageHash?: string
  ): Promise<FirebaseDiagnosisResult | null> {
    try {
      console.log('🔍 Cercando nel database locale per:', plantName);
      
      // Prima cerca per nome pianta
      let q = query(
        collection(db, 'plant_diagnoses'),
        where('plantName', '==', plantName),
        where('confidence', '>=', 80), // Solo risultati ad alta confidenza
        orderBy('confidence', 'desc'),
        limit(1)
      );
      
      let querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const result = {
          id: doc.id,
          ...doc.data()
        } as FirebaseDiagnosisResult;
        
        console.log('✅ Trovato risultato nel database locale');
        return result;
      }
      
      console.log('ℹ️ Nessun risultato trovato nel database locale');
      return null;
      
    } catch (error) {
      console.error('❌ Errore ricerca database locale:', error);
      return null;
    }
  }
}

export default FirebaseDiagnosisService;