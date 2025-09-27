import { useState } from 'react';
import { FileText, Download, ExternalLink, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PDFDisplayProps {
  pdfUrl: string;
  fileName?: string;
}

export const PDFDisplay = ({ pdfUrl, fileName }: PDFDisplayProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Download PDF con autenticazione...', { pdfUrl, fileName });
      
      // Prova prima il download diretto se è un URL pubblico
      if (pdfUrl.includes('/object/public/pdfs/')) {
        console.log('📁 URL pubblico rilevato, tentativo download diretto...');
        try {
          const response = await fetch(pdfUrl);
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName || 'documento.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            console.log('✅ PDF scaricato tramite fetch diretto');
            toast.success('PDF scaricato con successo!');
            return;
          }
        } catch (directError) {
          console.log('⚠️ Download diretto fallito, provo con Supabase...', directError);
        }
      }
      
      // Estrai il path dal URL completo per download tramite Supabase
      const urlParts = pdfUrl.split('/object/public/pdfs/');
      if (urlParts.length < 2) {
        console.error('❌ Formato URL PDF non valido:', pdfUrl);
        toast.error('URL PDF non valido');
        return;
      }
      
      const urlPath = urlParts[1];
      console.log('📁 Path PDF estratto per Supabase:', urlPath);
      
      // Usa il client Supabase autenticato per scaricare il file
      const { data, error } = await supabase.storage
        .from('pdfs')
        .download(urlPath);
        
      if (error) {
        console.error('❌ Errore download PDF da Supabase:', error);
        toast.error('Errore nel download del PDF: ' + error.message);
        return;
      }
      
      console.log('✅ PDF scaricato tramite Supabase');
      
      // Crea il download
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'documento.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF scaricato con successo!');
    } catch (error) {
      console.error('❌ Errore nel download del PDF:', error);
      toast.error('Errore nel download del PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = async () => {
    try {
      console.log('👁️ Apertura PDF per visualizzazione...', pdfUrl);
      
      // Estrai il path dal URL completo
      const urlPath = pdfUrl.split('/object/public/pdfs/')[1];
      if (!urlPath) {
        console.error('❌ Formato URL PDF non valido per visualizzazione:', pdfUrl);
        // Fallback: prova ad aprire l'URL direttamente
        window.open(pdfUrl, '_blank');
        return;
      }
      
      // Crea un URL firmato per la visualizzazione sicura
      const { data, error } = await supabase.storage
        .from('pdfs')
        .createSignedUrl(urlPath, 3600); // URL valido per 1 ora
        
      if (error) {
        console.error('❌ Errore creazione URL firmato:', error);
        // Fallback: prova ad aprire l'URL originale
        window.open(pdfUrl, '_blank');
        return;
      }
      
      console.log('✅ URL firmato creato per visualizzazione PDF');
      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('❌ Errore apertura PDF:', error);
      // Fallback: prova ad aprire l'URL originale
      window.open(pdfUrl, '_blank');
    }
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