import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';
import { Bell, BellOff, TestTube, Smartphone, Shield, AlertTriangle } from 'lucide-react';

export function NotificationSettings() {
  const {
    isSupported,
    permission,
    isLoading,
    requestPermission,
    sendTestNotification
  } = usePushNotifications();

  const handleEnableNotifications = async () => {
    const success = await requestPermission();
    if (success) {
      toast.success('Notifiche attivate con successo!');
    } else {
      toast.error('Impossibile attivare le notifiche');
    }
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
  };

  const getStatusBadge = () => {
    if (isLoading) {
      return <Badge variant="secondary">Inizializzazione...</Badge>;
    }
    
    if (!isSupported) {
      return <Badge variant="destructive">Non supportate</Badge>;
    }
    
    if (permission === 'granted') {
      return <Badge variant="default" className="bg-green-600">Attive</Badge>;
    }
    
    return <Badge variant="outline">Disattivate</Badge>;
  };

  const getStatusIcon = () => {
    if (!isSupported) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (permission === 'granted') return <Bell className="h-5 w-5 text-green-600" />;
    return <BellOff className="h-5 w-5 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Notifiche Push
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
                  ? permission === 'granted'
                    ? 'Le notifiche push sono attive e funzionanti'
                    : 'Le notifiche push sono disponibili ma non attivate'
                  : 'Le notifiche push non sono supportate in questo browser'
                }
              </p>
            </div>
            {getStatusBadge()}
          </div>

            <Button 
              onClick={handleEnableNotifications}
              disabled={!isSupported || permission === 'granted' || isLoading}
              className="w-full"
            >
              <Bell className="w-4 h-4 mr-2" />
              {permission === 'granted' ? 'Notifiche già attive' : 'Attiva notifiche'}
            </Button>

            <Button 
              onClick={handleTestNotification}
              variant="outline"
              disabled={permission !== 'granted'}
              className="w-full"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Invia notifica di test
            </Button>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span>Supporto browser: {isSupported ? '✅ Supportato' : '❌ Non supportato'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Permessi: {permission === 'granted' ? '✅ Concessi' : '❌ Non concessi'}</span>
            </div>
          </div>

          {!isSupported && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-900">Notifiche non supportate</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Il tuo browser non supporta le notifiche push o stai usando una connessione non sicura.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}