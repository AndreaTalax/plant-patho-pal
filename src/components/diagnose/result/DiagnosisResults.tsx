
import React from 'react';
import { Button } from '@/components/ui/button';

interface DiagnosisResultsProps {
  result: any;
  onConsultExpert: () => void;
}

const DiagnosisResults: React.FC<DiagnosisResultsProps> = ({ result, onConsultExpert }) => {
  const { enhancedResult, plantIdResult, shouldRecommendExpert } = result;

  return (
    <div className="space-y-4">
      {/* Mostra disclaimer se presente */}
      {enhancedResult?.disclaimer && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-yellow-600 mr-2">⚠️</div>
            <div>
              <h4 className="font-semibold text-yellow-800 mb-1">
                Attenzione
              </h4>
              <p className="text-yellow-700 text-sm">
                {enhancedResult.disclaimer}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Risultati disponibili */}
      {plantIdResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">
            🔍 Identificazione Base
          </h4>
          <p><strong>Pianta:</strong> {plantIdResult.plantName || 'Non identificata'}</p>
          {plantIdResult.confidence && (
            <p><strong>Confidenza:</strong> {Math.round(plantIdResult.confidence * 100)}%</p>
          )}
        </div>
      )}

      {/* Analisi potenziata se disponibile */}
      {enhancedResult && !enhancedResult.analysisError && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">
            🧠 Analisi AI Avanzata
          </h4>
          {enhancedResult.isHighConfidence ? (
            <div className="text-green-700">
              <p>✅ Analisi ad alta confidenza (≥90%)</p>
              {/* Mostra risultati dettagliati */}
            </div>
          ) : (
            <div className="text-orange-700">
              <p>⚠️ Analisi a bassa confidenza (&lt;90%)</p>
              <p className="text-sm mt-1">
                I risultati potrebbero non essere accurati. Si consiglia una consulenza esperta.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Raccomandazione esperto */}
      {shouldRecommendExpert && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-green-800 mb-1">
                🌿 Consulenza Esperta Raccomandata
              </h4>
              <p className="text-green-700 text-sm">
                Per una diagnosi accurata e professionale, consulta il nostro fitopatologo.
              </p>
            </div>
            <Button
              onClick={onConsultExpert}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Consulta Esperto
            </Button>
          </div>
        </div>
      )}

      {/* Se tutto è fallito, mostra solo l'opzione esperto */}
      {!plantIdResult && enhancedResult?.analysisError && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-2">🌱</div>
          <h4 className="font-semibold text-gray-800 mb-2">
            Analisi Non Disponibile
          </h4>
          <p className="text-gray-600 mb-4">
            L'analisi automatica non è riuscita a processare l'immagine.
            Il nostro esperto può aiutarti con una diagnosi professionale.
          </p>
          <Button
            onClick={onConsultExpert}
            className="bg-green-600 text-white hover:bg-green-700 px-6 py-3"
          >
            🌿 Consulta il Fitopatologo
          </Button>
        </div>
      )}
    </div>
  );
};

export default DiagnosisResults;
