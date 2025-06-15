
import React from "react";

interface PlantDataDetailsProps {
  symptoms: string;
  wateringText: string;
  environment: string;
  exposureText: string;
  imgUploaded: boolean;
}

const PlantDataDetails: React.FC<PlantDataDetailsProps> = ({
  symptoms,
  wateringText,
  environment,
  exposureText,
  imgUploaded,
}) => (
  <div>
    <span className="block font-semibold text-green-900 mb-1">{"\u{1F331}"} Dati della Pianta:</span>
    <ul className="space-y-1 text-sm ml-2">
      <li>
        <span className="font-medium">• Sintomi:</span>{" "}
        {symptoms || <span className="italic text-gray-400">-</span>}
      </li>
      <li>
        <span className="font-medium">• Irrigazione:</span>{" "}
        {wateringText || <span className="italic text-gray-400">-</span>}
      </li>
      <li>
        <span className="font-medium">• Esposizione:</span>{" "}
        {environment
          ? environment + (exposureText ? ` ${exposureText}` : "")
          : exposureText || <span className="italic text-gray-400">-</span>}
      </li>
      <li>
        <span className="font-medium">• Immagine:</span>{" "}
        {imgUploaded ? (
          <span className="text-green-700 font-semibold">
            Caricata {"\u2714"}
          </span>
        ) : (
          <span className="text-gray-400 font-medium">
            Non caricata {"\u2716"}
          </span>
        )}
      </li>
    </ul>
  </div>
);

export default PlantDataDetails;
