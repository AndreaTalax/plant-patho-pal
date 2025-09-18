import { useState } from 'react';
import { FileText, Download, ExternalLink, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFDisplayProps {
  pdfUrl: string;
  fileName?: string;
}

export const PDFDisplay = ({ pdfUrl, fileName }: PDFDisplayProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'documento.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Errore nel download del PDF:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="mt-3 max-w-xs">
      <div className="bg-white border-2 border-red-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200">
        {/* PDF Icon and Info */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {fileName || 'Documento PDF'}
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              File PDF allegato
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            className="flex-1 text-xs h-8 gap-1"
          >
            <Eye className="h-3 w-3" />
            Visualizza
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isLoading}
            className="flex-1 text-xs h-8 gap-1"
          >
            <Download className="h-3 w-3" />
            {isLoading ? 'Download...' : 'Scarica'}
          </Button>
        </div>

        {/* Alternative link for fallback */}
        <div className="mt-2 pt-2 border-t border-gray-100">
          <button
            onClick={handleView}
            className="text-blue-500 hover:underline text-xs flex items-center gap-1 w-full justify-center"
          >
            <ExternalLink className="h-3 w-3" />
            Apri in nuova scheda
          </button>
        </div>
      </div>
    </div>
  );
};