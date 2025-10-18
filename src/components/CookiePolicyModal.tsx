import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type CookiePolicyModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const CookiePolicyModal = ({ open, onOpenChange }: CookiePolicyModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Informativa sui Cookies</DialogTitle>
          <DialogDescription>Agr. Marco Nigro (ditta individuale)</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[70vh] mt-4">
          <div className="space-y-4 pr-4 text-sm">
            <section>
              <h2 className="text-lg font-semibold mb-2">CHE COSA È UN COOKIE?</h2>
              <p className="text-muted-foreground mb-3">
                Un <em>cookie</em> è un piccolo file di testo che viene memorizzato dal computer nel momento in cui un sito web viene visitato da un utente. Il testo memorizza informazioni che il sito è in grado di leggere nel momento in cui viene consultato in un secondo momento. Alcuni di questi <em>cookies</em> sono necessari al corretto funzionamento del sito, altri sono invece utili al visitatore perché in grado di memorizzare in modo sicuro ad esempio il nome utente o le impostazioni di lingua.
              </p>
              <p className="text-muted-foreground">
                I Cookie sono costituiti da porzioni di codice di piccole dimensioni che i siti visitati dall'utente inviano alla sua postazione (solitamente al browser), dove vengono memorizzati per essere poi ritrasmessi agli stessi siti durante la navigazione o alla successiva visita del medesimo utente.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">PERCHÉ IL SITO UTILIZZA I COOKIES?</h2>
              <p className="text-muted-foreground">
                Il sito utilizza i <em>cookies</em> al fine di fornire ai propri clienti un'esperienza di acquisto modellata il più possibile intorno ai suoi gusti e preferenze. Tramite i <em>cookies</em> <strong>Agr. Marco Nigro (ditta individuale)</strong> fa in modo che ad ogni visita sul sito non si debbano ricevere o inserire le stesse informazioni. I <em>cookies</em> vengono utilizzati anche al fine di ottimizzare le prestazioni del sito web: essi infatti rendono più facile sia il procedimento finale di acquisto che la ricerca veloce di elementi e prodotti specifici all'interno del sito.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">COOKIE TECNICI E DI STATISTICA AGGREGATA</h2>
              <p className="text-muted-foreground mb-3">
                I Cookie tecnici hanno la funzione di permettere lo svolgimento di attività strettamente legate al funzionamento del sito. I Cookie tecnici utilizzati dal Titolare possono essere suddivisi nelle seguenti sottocategorie:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>
                  <strong>Cookie di navigazione o di sessione:</strong> per mezzo dei quali si possono salvare le preferenze di navigazione ed ottimizzare l'esperienza di navigazione dell'Utente. Si tratta di Cookie fondamentali per navigare all'interno del sito utilizzando tutte le sue funzionalità.
                </li>
                <li>
                  <strong>Cookie di tipo analytics:</strong> per mezzo dei quali si acquisiscono informazioni statistiche in merito alle modalità di navigazione degli Utenti. Tali informazioni sono trattate in forma aggregata ed anonima.
                </li>
                <li>
                  <strong>Cookie di funzionalità:</strong> anche di terze parti, utilizzati per attivare specifiche funzionalità del sito e necessari ad erogare il servizio o migliorarlo.
                </li>
              </ul>
              <p className="text-muted-foreground mt-3">
                Tali Cookie non necessitano del preventivo consenso dell'Utente per essere installati ed utilizzati. Il sito web funziona in modo ottimale se i Cookie tecnici sono abilitati.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">ALTRE TIPOLOGIE DI COOKIE O STRUMENTI TERZI</h2>
              
              <h3 className="font-medium mt-4 mb-2">Visualizzazione di contenuti da piattaforme esterne</h3>
              <div className="text-muted-foreground mb-3">
                <p className="mb-2">Questi servizi permettono di visualizzare contenuti ospitati su piattaforme esterne direttamente dalle pagine di questa Applicazione.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Widget Video Youtube (Google Inc.):</strong> Youtube è un servizio di visualizzazione di contenuti video gestito da Google Inc. Dati personali raccolti: Cookie e Dati di utilizzo. Luogo del trattamento: USA</li>
                </ul>
              </div>

              <h3 className="font-medium mt-4 mb-2">Interazione con social network e piattaforme esterne</h3>
              <div className="text-muted-foreground mb-3">
                <p className="mb-2">Questi servizi permettono di effettuare interazioni con i social network direttamente dalle pagine di questo sito.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Facebook:</strong> Servizi di interazione con il social network Facebook</li>
                  <li><strong>Instagram:</strong> Servizi di interazione con il social network Instagram</li>
                  <li><strong>Twitter:</strong> Servizi di interazione con il social network Twitter</li>
                  <li><strong>LinkedIn:</strong> Pulsante e widget sociali di LinkedIn</li>
                </ul>
              </div>

              <h3 className="font-medium mt-4 mb-2">Statistica</h3>
              <div className="text-muted-foreground">
                <p className="mb-2"><strong>Google Analytics con IP anonimizzato (Google Inc.):</strong></p>
                <p>Google Analytics è un servizio di analisi web fornito da Google Inc. Questa integrazione rende anonimo il tuo indirizzo IP. L'anonimizzazione funziona abbreviando entro i confini degli Stati Membri dell'Unione Europea l'indirizzo IP degli Utenti. Solo in casi eccezionali, l'indirizzo IP sarà inviato ai server di Google ed abbreviato all'interno degli Stati Uniti.</p>
                <p className="mt-2">Dati personali raccolti: Cookie e Dati di utilizzo. Luogo del trattamento: USA</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">COME POSSO GESTIRE I COOKIE NEL MIO BROWSER?</h2>
              <p className="text-muted-foreground mb-3">
                L'Utente può gestire le preferenze relative ai Cookie direttamente all'interno del proprio browser ed impedire che terze parti possano installarne. Tramite le preferenze del browser è inoltre possibile eliminare i Cookie installati in passato.
              </p>
              <p className="text-muted-foreground mb-3">
                <strong>Nota:</strong> Disabilitando tutti i Cookie, il funzionamento di questo sito potrebbe essere compromesso.
              </p>
              <div className="space-y-1 text-muted-foreground">
                <p className="font-medium">Informazioni su come gestire i Cookie nei principali browser:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Google Chrome
                    </a>
                  </li>
                  <li>
                    <a href="https://support.mozilla.org/it/kb/protezione-antitracciamento-avanzata-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Mozilla Firefox
                    </a>
                  </li>
                  <li>
                    <a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Apple Safari
                    </a>
                  </li>
                  <li>
                    <a href="https://support.microsoft.com/it-it/help/17442/windows-internet-explorer-delete-manage-cookies" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Microsoft Edge/Internet Explorer
                    </a>
                  </li>
                </ul>
              </div>
            </section>

            <section className="pt-4 border-t">
              <h2 className="text-lg font-semibold mb-2">TITOLARE DEL TRATTAMENTO DEI DATI</h2>
              <p className="text-muted-foreground">
                <strong>Agr. Marco Nigro (ditta individuale)</strong><br />
                Via Salsomaggiore, 12 – 20159 Milano (MI) – Italia<br />
                P.Iva: 08867900964
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CookiePolicyModal;
