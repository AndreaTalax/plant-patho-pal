import { useState } from "react";
import { FileText, Download, ExternalLink, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PDFDisplayProps {
  pdfPath: string;   // 🔹 path interno (es: chat/12345-referto.pdf)
  fileName?: string; // nome da mostrare
  isOwnMessage?: boolean; // se il messaggio è dell'utente o dell'admin (per layout)
}

export const PDFDisplay = ({ pdfPath, fileName, isOwnMessage }: PDFDisplayProps) => {
  const [isLoading, setIsLoading] = useState(false);

  // 🔽 Scarica il PDF
  const handleDownload = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase.storage
        .from("pdfs")
        .createSignedUrl(pdfPath, 3600);

      if (error || !data?.signedUrl) {
        console.error("❌ Errore creazione URL firmato per download:", error);
        toast.error("Errore nel download del PDF");
        return;
      }

      // Usa fetch + blob per forzare il download
      const response = await fetch(data.signedUrl);
      if (!response.ok) throw new Error("Download fallito");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || pdfPath.split("/").pop() || "documento.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

      toast.success("PDF scaricato con successo!");
    } catch (err) {
      console.error("❌ Errore nel download del PDF:", err);
      toast.error("Errore nel download del PDF");
    } finally {
      setIsLoading(false);
    }
  };

  // 👁️ Visualizza PDF
  const handleView = async () => {
    try {
      const { data, error } = await supabase.storage
        .from("pdfs")
        .createSignedUrl(pdfPath, 3600);

      if (error || !data?.signedUrl) {
        console.error("❌ Errore creazione URL firmato per visualizzazione:", error);
        toast.error("Errore apertura PDF");
        return;
      }

      window.open(data.signedUrl, "_blank");
    } catch (err) {
      console.error("❌ Errore apertura PDF:", err);
      toast.error("Errore apertura PDF");
    }
  };

  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} my-2`}
    >
      <div
        className={`max-w-xs w-full rounded-2xl shadow-sm p-3 border transition-all duration-200 ${
          isOwnMessage
            ? "bg-green-50 border-green-200"
            : "bg-white border-gray-200"
        }`}
      >
        {/* Intestazione con icona */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {fileName || pdfPath.split("/").pop()}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">File PDF allegato</p>
          </div>
        </div>

        {/* Pulsanti azione */}
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
            {isLoading ? "Download..." : "Scarica"}
          </Button>
        </div>

        {/* Link alternativo */}
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
