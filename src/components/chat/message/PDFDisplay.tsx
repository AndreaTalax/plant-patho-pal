import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PDFDisplayProps {
  pdfPath: string;
  fileName?: string;
}

const PDFDisplay: React.FC<PDFDisplayProps> = ({ pdfPath, fileName = 'documento.pdf' }) => {
  console.log('📄 PDFDisplay: Rendering PDF with path:', pdfPath);

  const handleDownload = async () => {
    try {
      console.log('⬇️ PDFDisplay: Attempting to download PDF from:', pdfPath);

      // Poiché il bucket è pubblico, usiamo direttamente fetch
      const response = await fetch(pdfPath);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ PDFDisplay: Download completed successfully');
      toast.success('Download PDF completato');
    } catch (error) {
      console.error('❌ PDFDisplay: Error downloading PDF:', error);
      toast.error('Errore durante il download del PDF');
      // Fallback: apri in nuova tab
      window.open(pdfPath, '_blank');
    }
  };

  const handleView = async () => {
    try {
      console.log('👁️ PDFDisplay: Opening PDF in new tab:', pdfPath);

      // Poiché il bucket è pubblico, apri direttamente l'URL
      window.open(pdfPath, '_blank');
      console.log('✅ PDFDisplay: PDF opened in new tab');
    } catch (error) {
      console.error('❌ PDFDisplay: Error opening PDF:', error);
      toast.error("Errore durante l'apertura del PDF");
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <FileText className="h-8 w-8 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-900 truncate">{fileName}</p>
          <p className="text-xs text-blue-600">Documento PDF</p>
        </div>
      </div>

      <div className="mt-3 flex space-x-2">
        <Button onClick={handleView} variant="outline" size="sm" className="flex-1">
          <ExternalLink className="h-4 w-4 mr-1" />
          Visualizza
        </Button>
        <Button onClick={handleDownload} variant="default" size="sm" className="flex-1">
          <Download className="h-4 w-4 mr-1" />
          Scarica
        </Button>
      </div>
    </div>
  );
};

export default PDFDisplay;
