import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface PDFDisplayProps {
  pdfPath: string; // URL pubblico di Supabase (già generato via getPublicUrl)
  fileName?: string;
}

const PDFDisplay: React.FC<PDFDisplayProps> = ({ pdfPath, fileName = 'documento.pdf' }) => {
  console.log('📄 PDFDisplay montato con URL:', pdfPath);
  
  const isLovablePreview = typeof window !== 'undefined' && window.location.hostname.includes('id-preview');

  const handleDownload = async () => {
    try {
      console.log('⬇️ Download PDF da:', pdfPath);

      // Forza apertura diretta in tutti i casi (bucket pubblico)
      window.open(pdfPath, '_blank', 'noopener,noreferrer');
      toast.success('Apertura PDF in corso...');
      
    } catch (error) {
      console.error('❌ Errore durante l\'apertura del PDF:', error);
      toast.error('Errore durante l\'apertura del PDF');
    }
  };

  const handleView = () => {
    try {
      console.log('👁️ Apertura PDF:', pdfPath);
      window.open(pdfPath, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('❌ Errore durante la visualizzazione PDF:', error);
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
