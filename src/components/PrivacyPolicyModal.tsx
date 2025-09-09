
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{t("privacyPolicy")}</DialogTitle>
          <DialogDescription>Last updated: May 5, 2025</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] mt-4">
          <div className="space-y-4 pr-4">
            <section>
              <h2 className="text-lg font-semibold mb-2">1. Introduzione</h2>
              <p className="text-sm text-muted-foreground">
                Plant Patho Pal ("noi", "nostro", o "ci") è impegnata a proteggere la vostra privacy. Questa Informativa sulla Privacy spiega come vengono raccolte, utilizzate e divulgate le vostre informazioni personali da Plant Patho Pal. Utilizzando il nostro servizio, accettate la raccolta, l'archiviazione, l'uso e la divulgazione delle vostre informazioni personali come descritto in questa Informativa sulla Privacy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">2. Dati Personali che Raccogliamo</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-sm">Dati di Registrazione:</h3>
                  <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                    <li>Nome e cognome</li>
                    <li>Indirizzo email</li>
                    <li>Username</li>
                    <li>Password (criptata)</li>
                    <li>Data di nascita</li>
                    <li>Luogo di nascita</li>
                    <li>Numero di telefono</li>
                    <li>Indirizzo</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Dati di Utilizzo:</h3>
                  <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                    <li>Foto di piante caricate</li>
                    <li>Diagnosi effettuate</li>
                    <li>Cronologia delle consultazioni</li>
                    <li>Preferenze utente</li>
                    <li>Messaggi nelle chat con esperti</li>
                    <li>Ordini e acquisti effettuati</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Dati Tecnici:</h3>
                  <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                    <li>Indirizzo IP</li>
                    <li>Tipo di dispositivo e browser</li>
                    <li>Sistema operativo</li>
                    <li>Dati di geolocalizzazione (se autorizzata)</li>
                    <li>Cookie e tecnologie simili</li>
                    <li>Log di accesso e utilizzo</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">3. Come Utilizziamo i Vostri Dati</h2>
              <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                <li>Fornire e mantenere il servizio di diagnosi delle malattie delle piante</li>
                <li>Elaborare e migliorare le diagnosi tramite intelligenza artificiale</li>
                <li>Facilitare la comunicazione con esperti agronomi</li>
                <li>Personalizzare l'esperienza utente</li>
                <li>Elaborare ordini e pagamenti</li>
                <li>Inviare notifiche di servizio e aggiornamenti</li>
                <li>Condurre analisi per migliorare i nostri servizi</li>
                <li>Garantire la sicurezza e prevenire frodi</li>
                <li>Rispettare obblighi legali e normativi</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">4. Condivisione dei Dati con Terze Parti</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-sm">Servizi di Analytics:</h3>
                  <p className="text-sm text-muted-foreground">Google Analytics, Firebase Analytics per analizzare l'utilizzo dell'app</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Servizi AI:</h3>
                  <p className="text-sm text-muted-foreground">Fornitori di servizi di intelligenza artificiale per la diagnosi delle piante</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Processori di Pagamento:</h3>
                  <p className="text-sm text-muted-foreground">Stripe, PayPal per elaborare i pagamenti</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm">Servizi Cloud:</h3>
                  <p className="text-sm text-muted-foreground">Supabase per l'archiviazione sicura dei dati</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">5. Conservazione dei Dati</h2>
              <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                <li><strong>Account attivi:</strong> Per tutta la durata dell'account</li>
                <li><strong>Account cancellati:</strong> 90 giorni dopo la cancellazione</li>
                <li><strong>Dati di diagnosi:</strong> 5 anni per ricerca scientifica (anonimizzati)</li>
                <li><strong>Log di sistema:</strong> 2 anni per sicurezza</li>
                <li><strong>Dati di fatturazione:</strong> 10 anni per obblighi fiscali</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">6. I Vostri Diritti (GDPR)</h2>
              <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                <li><strong>Accesso:</strong> Richiedere una copia dei vostri dati personali</li>
                <li><strong>Rettifica:</strong> Correggere dati inaccurati o incompleti</li>
                <li><strong>Cancellazione:</strong> Richiedere la cancellazione dei vostri dati ("diritto all'oblio")</li>
                <li><strong>Limitazione:</strong> Limitare il trattamento dei vostri dati</li>
                <li><strong>Portabilità:</strong> Ricevere i vostri dati in formato strutturato</li>
                <li><strong>Opposizione:</strong> Opporsi al trattamento per motivi legittimi</li>
                <li><strong>Revoca consenso:</strong> Revocare il consenso in qualsiasi momento</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">7. Protezione dei Minori (COPPA)</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Il nostro servizio non è destinato a minori di 13 anni. Se scopriamo di aver raccolto dati personali da un minore di 13 anni:
              </p>
              <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                <li>Cancelleremo immediatamente tali dati</li>
                <li>Richiederemo il consenso verificabile dei genitori per utenti tra 13-16 anni</li>
                <li>Limiteremo la raccolta dati ai soli dati necessari per il servizio</li>
                <li>Non utilizzeremo dati di minori per marketing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">8. Sicurezza dei Dati</h2>
              <ul className="list-disc pl-5 mt-2 text-sm text-muted-foreground space-y-1">
                <li>Crittografia end-to-end per dati sensibili</li>
                <li>Autenticazione a due fattori disponibile</li>
                <li>Monitoraggio continuo per attività sospette</li>
                <li>Backup regolari e sicuri</li>
                <li>Accesso limitato al personale autorizzato</li>
                <li>Audit di sicurezza periodici</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">9. Violazioni dei Dati</h2>
              <p className="text-sm text-muted-foreground">
                In caso di violazione dei dati personali, notificheremo le autorità competenti entro 72 ore e informeremo gli utenti interessati entro le tempistiche previste dal GDPR, fornendo dettagli sulla natura della violazione e le misure adottate.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">10. Trasferimenti Internazionali</h2>
              <p className="text-sm text-muted-foreground">
                I vostri dati possono essere trasferiti e conservati in paesi al di fuori dello Spazio Economico Europeo. Garantiamo che tali trasferimenti rispettino le decisioni di adeguatezza della Commissione Europea o siano protetti da clausole contrattuali standard approvate.
              </p>
            </section>
            
            <section>
              <h2 className="text-lg font-semibold mb-2">Contact Us</h2>
              <p className="text-sm text-gray-600">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <ul className="list-disc pl-5 mt-2 text-sm text-gray-600">
                <li>By email: privacy@plantpathopal.com</li>
                <li>By visiting this page on our website: www.plantpathopal.com/contact</li>
                <li>By phone number: +123 456 7890</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyPolicyModal;
