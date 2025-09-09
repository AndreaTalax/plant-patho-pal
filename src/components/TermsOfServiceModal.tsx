import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/context/ThemeContext";

type TermsOfServiceModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const TermsOfServiceModal = ({ open, onOpenChange }: TermsOfServiceModalProps) => {
  const { t } = useTheme();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Termini di Servizio</DialogTitle>
          <DialogDescription>Ultimo aggiornamento: 9 Settembre 2025</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] mt-4">
          <div className="space-y-4 pr-4">
            <section>
              <h2 className="text-lg font-semibold mb-2">1. Accettazione dei Termini</h2>
              <p className="text-sm text-muted-foreground">
                Accedendo e utilizzando Plant Patho Pal, accettate di essere vincolati da questi Termini di Servizio e da tutte le leggi e normative applicabili. Se non siete d'accordo con uno qualsiasi di questi termini, vi è vietato utilizzare questo servizio.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">2. Descrizione del Servizio</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Plant Patho Pal fornisce:
              </p>
              <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                <li>Servizi di diagnosi delle malattie delle piante tramite intelligenza artificiale</li>
                <li>Consultazioni con esperti agronomi</li>
                <li>Raccomandazioni per prodotti fitosanitari</li>
                <li>Biblioteca di articoli scientifici</li>
                <li>Strumenti di monitoraggio delle colture</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">3. Registrazione e Account</h2>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Per utilizzare il servizio, dovete:</p>
                <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                  <li>Fornire informazioni accurate e complete durante la registrazione</li>
                  <li>Mantenere la sicurezza delle vostre credenziali di accesso</li>
                  <li>Notificarci immediatamente di qualsiasi uso non autorizzato</li>
                  <li>Essere responsabili di tutte le attività sotto il vostro account</li>
                  <li>Avere almeno 18 anni o il consenso dei genitori se minori</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">4. Uso Accettabile</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-sm">È permesso:</h3>
                  <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                    <li>Utilizzare il servizio per scopi agricoli legittimi</li>
                    <li>Caricare foto di piante di vostra proprietà</li>
                    <li>Condividere informazioni accurate sulle colture</li>
                    <li>Interagire rispettosamente con gli esperti</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-sm">È vietato:</h3>
                  <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                    <li>Utilizzare il servizio per attività illegali</li>
                    <li>Caricare contenuti offensivi o inappropriati</li>
                    <li>Tentare di aggirare le misure di sicurezza</li>
                    <li>Utilizzare bot o sistemi automatizzati</li>
                    <li>Rivendere o trasferire il vostro account</li>
                    <li>Interferire con il funzionamento del servizio</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">5. Abbonamenti e Pagamenti</h2>
              <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                <li>Gli abbonamenti si rinnovano automaticamente</li>
                <li>I prezzi possono cambiare con preavviso di 30 giorni</li>
                <li>Le cancellazioni devono essere effettuate prima del rinnovo</li>
                <li>I rimborsi sono soggetti alla nostra politica di rimborso</li>
                <li>L'accesso ai servizi premium termina alla scadenza dell'abbonamento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">6. Proprietà Intellettuale</h2>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Tutti i contenuti, marchi, loghi e materiali su Plant Patho Pal sono di nostra proprietà o concessi in licenza.
                </p>
                <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                  <li>Mantieni la proprietà delle foto che carichi</li>
                  <li>Ci concedi una licenza per utilizzare le tue foto per migliorare il servizio</li>
                  <li>Non puoi utilizzare i nostri contenuti senza autorizzazione</li>
                  <li>Rispettiamo i diritti di proprietà intellettuale di terzi</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">7. Limitazioni di Responsabilità</h2>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">
                  IMPORTANTE: Le nostre diagnosi sono indicative e non sostituiscono il parere di un agronomo qualificato.
                </p>
                <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                  <li>Non garantiamo l'accuratezza al 100% delle diagnosi AI</li>
                  <li>Non siamo responsabili per danni alle colture</li>
                  <li>Il servizio è fornito "così com'è"</li>
                  <li>Escludiamo garanzie implicite di commerciabilità</li>
                  <li>La nostra responsabilità è limitata all'importo pagato per il servizio</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">8. Terminazione</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Possiamo terminare o sospendere il vostro account in caso di:
              </p>
              <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                <li>Violazione di questi termini</li>
                <li>Attività fraudolenta o illegale</li>
                <li>Mancato pagamento</li>
                <li>Richiesta dell'utente</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">9. Conformità Normativa</h2>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Il nostro servizio rispetta:
                </p>
                <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                  <li><strong>GDPR:</strong> Regolamento Generale sulla Protezione dei Dati</li>
                  <li><strong>COPPA:</strong> Children's Online Privacy Protection Act</li>
                  <li><strong>Normative EU:</strong> Regolamenti sui prodotti fitosanitari</li>
                  <li><strong>Normative italiane:</strong> Codice del Consumo e Privacy</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">10. Dispute e Legge Applicabile</h2>
              <p className="text-sm text-muted-foreground">
                Questi termini sono regolati dalla legge italiana. Eventuali dispute saranno risolte presso i tribunali competenti di Milano, Italia, salvo diritti irrinunciabili dei consumatori.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">11. Modifiche ai Termini</h2>
              <p className="text-sm text-muted-foreground">
                Ci riserviamo il diritto di modificare questi termini in qualsiasi momento. Le modifiche sostanziali saranno comunicate con 30 giorni di preavviso. L'uso continuato del servizio costituisce accettazione delle modifiche.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">12. Contatti</h2>
              <p className="text-sm text-muted-foreground">
                Per domande sui Termini di Servizio:
              </p>
              <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground">
                <li>Email: legal@plantpathopal.com</li>
                <li>Telefono: +39 02 1234 5678</li>
                <li>Indirizzo: Via Roma 123, 20121 Milano, Italia</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TermsOfServiceModal;