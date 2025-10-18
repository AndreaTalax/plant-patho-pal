
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/context/ThemeContext";

type PrivacyPolicyModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Renders a modal dialog displaying the privacy policy content, enabling users to view the policy in a structured format.
 * @example
 * renderPrivacyPolicyModal(open, onOpenChange)
 * <Dialog open={true} .../>
 * @param {boolean} open - Indicates if the privacy policy modal is currently open or closed.
 * @param {function} onOpenChange - Callback function that handles the change in the modal's open state.
 * @returns {JSX.Element} A dialog component containing the privacy policy details with structured sections for easy readability.
 * @description
 *   - Utilizes a dialog to present a structured privacy policy.
 *   - The policy includes sections on definitions, information collection, usage, and contact details.
 *   - Maintains security measures for user data display and interaction.
 */
const PrivacyPolicyModal = ({ open, onOpenChange }: PrivacyPolicyModalProps) => {
  const { t } = useTheme();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Privacy Policy</DialogTitle>
          <DialogDescription>Ultimo aggiornamento: 21 Maggio 2021</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[70vh] mt-4">
          <div className="space-y-4 pr-4 text-sm">
            <section>
              <h2 className="text-lg font-bold mb-3">PRIVACY POLICY ai sensi degli artt. 13 e 14 del Reg. UE 2016/679</h2>
              <p className="text-muted-foreground mb-3">
                Con il consenso alla seguente dichiarazione sulla protezione dei dati autorizzi <strong>Agr. Marco Nigro (ditta individuale), libero professionista iscritto al Collegio degli Agrotecnici e Agrotecnici Laureati di Milano n. 394</strong> – via Salsomaggiore, 12 – 20159 Milano (MI) a rilevare, elaborare ed utilizzare i tuoi dati personali nel rispetto delle leggi in materia di protezione dei dati e delle seguenti disposizioni.
              </p>
              <p className="text-muted-foreground mb-3">
                Il D.Lgs. 30.06.2003 n. 196 ha la finalità di garantire che il trattamento dei dati personali si svolga nel rispetto dei diritti, delle libertà fondamentali, nonché della dignità delle persone fisiche, con particolare riferimento alla riservatezza e all'identità personale.
              </p>
              <p className="text-muted-foreground">
                Agr. Marco Nigro (di seguito Marco Nigro), con sede operativa a Milano (MI) in via Salsomaggiore 12, P.Iva 08867900964, titolare del sito agrotecnicomarconigro.it, e dei servizi connessi, fornisce le informazioni riguardanti l'utilizzo dei dati personali forniti per l'acquisto dei prodotti in vendita sul sito in osservanza del Decreto Legislativo 30 giugno 2003 n. 196.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">INFORMATIVA</h2>
              <p className="text-muted-foreground mb-3">
                I dati personali raccolti saranno oggetto di trattamento (come definito dall'art. 11 e seguenti del Dlgs 196/2003), mediante archiviazione automatizzata nel sistema informatico di Marco Nigro, per finalità connesse alle attività del sito agrotecnicomarconigro.it quali:
              </p>
              <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                <li>per fornire assistenza all'uso del sito e ai Servizi del sito e, in generale, per la gestione del sito e dei Servizi del sito</li>
                <li>per inviare comunicazioni relative alle modalità di utilizzo del sito e dei Servizi del sito a cui ti sei iscritto</li>
                <li>per gestire opportunamente gli ordini del cliente in tutte le loro fasi</li>
                <li>per comunicare ai partner di Marco Nigro che svolgono funzioni strettamente connesse e strumentali all'operatività del servizio quei dati necessari alla fornitura dei servizi richiesti, quali la gestione dei pagamenti e della consegna della merce acquistata</li>
                <li>per finalità statistiche solo dopo analisi dei dati su base aggregata e mai individuale</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">CATEGORIE DI DATI PERSONALI</h2>
              
              <h3 className="font-semibold mt-4 mb-2">1. DATI PERSONALI RACCOLTI AUTOMATICAMENTE</h3>
              <p className="text-muted-foreground mb-2">
                <strong>Dati di navigazione:</strong> i sistemi informatici e le procedure software preposte al funzionamento di questo sito web acquisiscono, nel corso del loro normale esercizio, alcuni dati personali la cui trasmissione è implicita nell'uso dei protocolli di comunicazione di Internet.
              </p>

              <h3 className="font-semibold mt-4 mb-2">2. DATI PERSONALI DA LEI DIRETTAMENTE FORNITI</h3>
              <p className="text-muted-foreground mb-2">
                Per dati personali si intendono le indicazioni in merito a situazioni oggettive o personali di una specifica persona fisica o di una persona fisica identificabile. Si tratta per esempio del tuo nome, del tuo numero di telefono, del tuo indirizzo e di tutti i dati che ci comunichi all'atto della registrazione e quando apri il tuo conto cliente.
              </p>

              <h3 className="font-semibold mt-4 mb-2">3. FINALITÀ E BASE GIURIDICA DEL TRATTAMENTO</h3>
              <p className="text-muted-foreground mb-2">
                I dati personali sono raccolti e trattati con modalità telematiche, anche con l'ausilio di mezzi elettronici e informativi, secondo i principi di necessità, liceità, correttezza, proporzionalità e trasparenza per le finalità indicate nella presente informativa.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">COOKIES</h2>
              <p className="text-muted-foreground mb-3">
                L'accettazione dei cookies non è una condizione necessaria al fine di visitare i nostri siti web. Ti avvisiamo, però, che l'utilizzo della funzione "carrello" e l'ordine di prodotti sono possibili soltanto se autorizzi l'utilizzo dei cookie.
              </p>
              
              <h3 className="font-medium mt-3 mb-2">Cosa sono i cookies?</h3>
              <p className="text-muted-foreground mb-3">
                I cookies sono dei piccoli file che vengono salvati sul tuo dispositivo e che memorizzano impostazioni e dati specifici per lo scambio con il nostro sistema attraverso il tuo browser.
              </p>

              <h3 className="font-medium mt-3 mb-2">Quali cookies utilizza Agr. Marco Nigro?</h3>
              <p className="text-muted-foreground mb-2">
                La maggior parte dei cookies che utilizziamo al momento della chiusura del browser (fine sessione) sono cancellati automaticamente dal tuo disco rigido (session-cookies). Utilizziamo anche cookies temporanei o permanenti (durata da 1 mese a 10 anni) che restano sul tuo disco rigido.
              </p>

              <div className="mt-3 p-3 bg-muted rounded-md">
                <p className="text-xs font-medium mb-2">Cookie utilizzati:</p>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• _ga, _gid, _gat (Google Analytics)</li>
                  <li>• LANG, x-pp-s, tsrce, ts, nsid (PayPal)</li>
                  <li>• fr (Facebook)</li>
                  <li>• _AVESTA_ENVIRONMENT (MailChimp)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">TRASFERIMENTO SICURO DEI DATI</h2>
              <p className="text-muted-foreground">
                Trasferiamo i tuoi dati personali in maniera sicura attraverso la codifica SSL (Secure Socket Layer). Proteggiamo i nostri siti web e altri sistemi con soluzioni tecniche ed organizzative per evitare la perdita, la distruzione, l'accesso, la modifica o la divulgazione dei tuoi dati da parte di persone non autorizzate.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">DESTINATARI DEI DATI PERSONALI</h2>
              <p className="text-muted-foreground mb-3">
                I tuoi dati personali saranno comunicati a terzi soltanto se questo è necessario per l'adempimento del contratto o la fatturazione o se hai preventivamente dato il tuo consenso. I nostri prestatori di servizio (trasportatori, ditte logistiche, banche) ricevono i dati necessari per l'adempimento dell'ordine e del contratto.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">PERIODO DI CONSERVAZIONE</h2>
              <p className="text-muted-foreground mb-2">
                <strong>Agr. Marco Nigro</strong> conserva i Suoi dati personali per il tempo strettamente necessario al perseguimento delle finalità sopra indicate nel rispetto degli obblighi civilistici e fiscali di conservazione.
              </p>
              <p className="text-muted-foreground">
                I dati trattati per adempiere qualsiasi obbligazione contrattuale potranno essere conservati per tutta la durata del contratto oltre che per successivi 10 anni dal termine dell'anno fiscale seguente, per affrontare qualsiasi accertamento e/o controversia di natura fiscale.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">I SUOI DIRITTI</h2>
              <p className="text-muted-foreground mb-2">
                In quanto interessato, ai sensi degli artt.15-21 del Regolamento Lei ha il diritto di:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>ricevere conferma dell'esistenza dei Suoi dati personali, accedere al loro contenuto e ottenerne copia (diritto di accesso)</li>
                <li>aggiornare, modificare e/o correggere i Suoi dati personali (diritto di rettifica)</li>
                <li>chiederne la cancellazione o la limitazione del trattamento dei dati (diritto alla cancellazione)</li>
                <li>revocare il consenso in qualsiasi momento (diritto di revoca del consenso)</li>
                <li>ricevere copia dei dati in formato strutturato (diritto alla portabilità dei dati)</li>
                <li>opporsi al trattamento dei Suoi dati per finalità di marketing diretto (diritto di opposizione)</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                Può esercitare i Suoi diritti scrivendo a: <a href="mailto:marco.nigro@hortives.it" className="text-primary hover:underline">marco.nigro@hortives.it</a> o inviando una lettera a: Via Salsomaggiore, 12 – 20159 Milano.
              </p>
              <p className="text-muted-foreground mt-2">
                In qualunque momento può proporre reclamo all'Autorità di controllo: <a href="http://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.garanteprivacy.it</a>
              </p>
            </section>

            <section className="pt-4 border-t">
              <h2 className="text-lg font-semibold mb-2">TITOLARE DEL TRATTAMENTO</h2>
              <p className="text-muted-foreground">
                <strong>Agr. Marco Nigro (ditta individuale)</strong><br />
                Via Salsomaggiore, 12 – 20159 Milano (MI) – Italia<br />
                P.Iva: 08867900964<br />
                Email: <a href="mailto:marco.nigro@hortives.it" className="text-primary hover:underline">marco.nigro@hortives.it</a>
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyPolicyModal;
