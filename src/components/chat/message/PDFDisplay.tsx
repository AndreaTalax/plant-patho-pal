import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface PDFDisplayProps {
  pdfPath: string; // URL pubblico di Supabase (già generato via getPublicUrl)
  fileName?: string;
}

const PDFDisplay: React.FC<PDFDisplayProps> = ({ pdfPath, fileName = 'documento.pdf' }) => {
  // 🔍 Rileva se stiamo girando nel sandbox di Lovable (id-preview)
  const isLovablePreview = typeof window !== 'undefined' && window.location.hostname.includes('id-preview');

  const handleDownload = async () => {
    try {
      console.log('⬇️ Download PDF da:', pdfPath);

      // In Lovable sandbox, forziamo apertura diretta
      if (isLovablePreview) {
        window.open(pdfPath, '_blank', 'noopener,noreferrer');
        toast.info('Download aperto in nuova scheda (sandbox)');
        return;
      }

      // Altrimenti esegui fetch normale
      const response = await fetch(pdfPath);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Download completato ✅');
    } catch (error) {
      console.error('❌ Errore nel download del PDF:', error);
      toast.error('Errore durante il download del PDF');
      window.open(pdfPath, '_blank');
    }
  };

  const handleView = () => {
    try {
      console.log('👁️ Apertura PDF:', pdfPath);

      // Se siamo nel sandbox Lovable, apri direttamente in nuova tab
      if (isLovablePreview) {
        window.open(pdfPath, '_blank', 'noopener,noreferrer');
        toast.info('Apertura forzata in sandbox');
        return;
      }

      // Normale apertura diretta
      window.open(pdfPath, '_blank');
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
