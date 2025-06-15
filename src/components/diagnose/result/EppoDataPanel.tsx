import React from 'react';

interface EppoDataPanelProps {
  analysisDetails: any;
  userInput: string;
  eppoData: any[];
}

const EppoDataPanel = ({ analysisDetails, userInput, eppoData }: EppoDataPanelProps) => {
  // Funzione helper per ottenere la probabilità in %
  const getProbabilityDisplay = (issue: any) => {
    let probRaw = issue.probability ?? issue.confidence;
    // Supporta numeri tra 0 e 1 e tra 0 e 100
    if (typeof probRaw === "number") {
      probRaw = probRaw <= 1 ? (probRaw * 100) : probRaw; // es: 0.85 → 85, 85 → 85
      return `${Math.round(probRaw)}% probability`;
    }
    return "–% probability";
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3">
        <span className="font-bold text-red-800 text-base tracking-tight">
          Corrispondenze dal database EPPO
        </span>
        <p className="text-sm text-gray-600 mt-1">
          Abbiamo trovato corrispondenze nel database EPPO (European and Mediterranean Plant Protection Organization) basate sui sintomi che hai descritto.
        </p>
        {userInput && (
          <p className="text-sm text-gray-500 mt-2 italic">
            Input utente: "{userInput}"
          </p>
        )}
      </div>

      <div className="space-y-4">
        {eppoData.map((issue, idx) => (
          <div key={idx} className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-red-900">{issue.name ?? "Issue sconosciuto"}</span>
              <span className="text-xs text-red-600 font-medium px-2 py-1 rounded bg-white border" style={{ minWidth: "70px", textAlign: "right" }}>
                {getProbabilityDisplay(issue)}
              </span>
            </div>
            <div className="text-gray-700 text-sm mb-1">{issue.description}</div>
            {issue.treatment && (
              <div className="text-green-700 text-sm font-medium">
                Treatment: {issue.treatment}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
export default EppoDataPanel;
