import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications';
import { toast } from 'sonner';
import { Bell, BellOff, TestTube, Smartphone, Shield, AlertTriangle } from 'lucide-react';

export function NotificationSettings() {
  const {
    isSupported,
    isPermissionGranted,
    isInitialized,
    fcmToken,
    requestPermission,
    sendTestNotification
  } = useFirebaseNotifications();

  const handleEnableNotifications = async () => {
    const success = await requestPermission();
    if (success) {
      toast.success('Notifiche push attivate! Ora riceverai notifiche per nuovi messaggi in chat');
    }
  };

  const getStatusBadge = () => {
    if (!isInitialized) {
      return <Badge variant="secondary">Inizializzazione...</Badge>;
    }
    
    if (!isSupported) {
      return <Badge variant="destructive">Non supportato</Badge>;
    }
    
    if (isPermissionGranted) {
      return <Badge variant="default" className="bg-green-600">Attivate</Badge>;
    }
    
    return <Badge variant="secondary">Disattivate</Badge>;
  };

  const getStatusIcon = () => {
    if (!isSupported) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (isPermissionGranted) return <Bell className="h-5 w-5 text-green-600" />;
    return <BellOff className="h-5 w-5 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Notifiche Push Firebase
          </CardTitle>
          <CardDescription>
            Ricevi notifiche in tempo reale quando arrivano nuovi messaggi in chat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Stato notifiche</p>
              <p className="text-sm text-muted-foreground">
                {isSupported 
                  ? isPermissionGranted 
                    ? 'Le notifiche push sono attive e funzionanti'
                    : 'Le notifiche push sono disponibili ma non attivate'
                  : 'Le notifiche push non sono supportate in questo browser'
                }
              </p>
            </div>
            {getStatusBadge()}
          </div>

          {isSupported && !isPermissionGranted && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900">Abilita le notifiche</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Attiva le notifiche push per ricevere avvisi immediati quando:
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
                    <li>Un esperto risponde ai tuoi messaggi</li>
                    <li>Ricevi nuovi messaggi in chat</li>
                    <li>Ci sono aggiornamenti importanti</li>
                  </ul>
                  <Button 
                    onClick={handleEnableNotifications}
                    className="mt-3"
                    size="sm"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Attiva Notifiche
                  </Button>
                </div>
              </div>
            </div>
          )}

          {isPermissionGranted && fcmToken && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-900">Notifiche attive</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Le notifiche push sono configurate correttamente. Riceverai notifiche per:
                  </p>
                  <ul className="text-sm text-green-700 mt-2 ml-4 list-disc">
                    <li>💬 Nuovi messaggi in chat</li>
                    <li>🌱 Risposte degli esperti</li>
                    <li>📝 Aggiornamenti delle consulenze</li>
                  </ul>
                  
                  <div className="mt-3 flex gap-2">
                    <Button 
                      onClick={sendTestNotification}
                      variant="outline"
                      size="sm"
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Invia Test
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isSupported && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-900">Notifiche non supportate</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Il tuo browser non supporta le notifiche push o stai usando una connessione non sicura.
                  </p>
                  <p className="text-sm text-yellow-700 mt-2">
                    Per abilitare le notifiche:
                  </p>
                  <ul className="text-sm text-yellow-700 mt-1 ml-4 list-disc">
                    <li>Usa un browser moderno (Chrome, Firefox, Safari)</li>
                    <li>Assicurati di essere su HTTPS</li>
                    <li>Controlla le impostazioni del browser</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {fcmToken && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Informazioni tecniche
              </summary>
              <div className="mt-2 p-3 bg-muted rounded text-xs">
                <p><strong>FCM Token:</strong></p>
                <code className="block mt-1 break-all">{fcmToken}</code>
              </div>
            </details>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Come funzionano le notifiche</CardTitle>
          <CardDescription>
            Guida al sistema di notifiche Firebase integrato
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-blue-600">1</span>
            </div>
            <div>
              <p className="font-medium">Invio messaggio</p>
              <p className="text-sm text-muted-foreground">
                Quando invii un messaggio in chat, il sistema attiva automaticamente il processo di notifica
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-blue-600">2</span>
            </div>
            <div>
              <p className="font-medium">Elaborazione CDC</p>
              <p className="text-sm text-muted-foreground">
                Il sistema CDC cattura l'evento di nuovo messaggio e identifica il destinatario
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-blue-600">3</span>
            </div>
            <div>
              <p className="font-medium">Invio notifica Firebase</p>
              <p className="text-sm text-muted-foreground">
                Firebase invia la notifica push al dispositivo del destinatario in tempo reale
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-green-600">✓</span>
            </div>
            <div>
              <p className="font-medium">Ricezione notifica</p>
              <p className="text-sm text-muted-foreground">
                L'utente riceve la notifica istantaneamente, anche se l'app è chiusa
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}