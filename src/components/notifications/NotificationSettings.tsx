import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bell, BellOff, TestTube, Smartphone, Shield, AlertTriangle, Mail } from 'lucide-react';

export function NotificationSettings() {
  const { userProfile, updateProfile } = useAuth();
  const {
    isSupported,
    permission,
    isLoading,
    requestPermission,
    sendTestNotification
  } = usePushNotifications();

  const [pushEnabled, setPushEnabled] = useState(userProfile?.push_notifications_enabled ?? true);
  const [emailEnabled, setEmailEnabled] = useState(userProfile?.email_notifications_enabled ?? true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setPushEnabled(userProfile.push_notifications_enabled ?? true);
      setEmailEnabled(userProfile.email_notifications_enabled ?? true);
    }
  }, [userProfile]);

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

  const handlePushToggle = async (enabled: boolean) => {
    if (!userProfile) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ push_notifications_enabled: enabled } as any)
        .eq('id', userProfile.id);

      if (error) throw error;

      setPushEnabled(enabled);
      await updateProfile({ push_notifications_enabled: enabled } as any);
      toast.success(enabled ? 'Notifiche push attivate' : 'Notifiche push disattivate');
    } catch (error) {
      console.error('Error updating push notifications:', error);
      toast.error('Errore durante l\'aggiornamento');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailToggle = async (enabled: boolean) => {
    if (!userProfile) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ email_notifications_enabled: enabled } as any)
        .eq('id', userProfile.id);

      if (error) throw error;

      setEmailEnabled(enabled);
      await updateProfile({ email_notifications_enabled: enabled } as any);
      toast.success(enabled ? 'Notifiche email attivate' : 'Notifiche email disattivate');
    } catch (error) {
      console.error('Error updating email notifications:', error);
      toast.error('Errore durante l\'aggiornamento');
    } finally {
      setIsSaving(false);
    }
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
    if (!isSupported) return <AlertTriangle className="h-5 w-5 text-destructive" />;
    if (permission === 'granted') return <Bell className="h-5 w-5 text-success" />;
    return <BellOff className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Notifiche Email
          </CardTitle>
          <CardDescription>
            Ricevi notifiche via email per messaggi importanti
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="email-notifications" className="text-base font-medium">
                📧 Notifiche Email
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Ricevi email quando arrivano nuovi messaggi
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailEnabled}
              onCheckedChange={handleEmailToggle}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
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
            <div className="flex-1">
              <Label htmlFor="push-notifications" className="text-base font-medium">
                🔔 Notifiche Push
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {isSupported 
                  ? permission === 'granted'
                    ? 'Le notifiche push sono attive e funzionanti'
                    : 'Le notifiche push sono disponibili ma non attivate'
                  : 'Le notifiche push non sono supportate in questo browser'
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              {(permission as string) === 'granted' && (
                <Switch
                  id="push-notifications"
                  checked={pushEnabled}
                  onCheckedChange={handlePushToggle}
                  disabled={isSaving}
                />
              )}
            </div>
          </div>

          {(permission as string) !== 'granted' && (
            <Button 
              onClick={handleEnableNotifications}
              disabled={!isSupported || (permission as string) === 'granted' || isLoading}
              className="w-full"
            >
              <Bell className="w-4 h-4 mr-2" />
              {(permission as string) === 'granted' ? 'Notifiche già attive' : 'Attiva notifiche'}
            </Button>
          )}

          {(permission as string) === 'granted' && (
            <Button
              onClick={handleTestNotification}
              variant="outline"
              disabled={!pushEnabled}
              className="w-full"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Invia notifica di test
            </Button>
          )}

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
            <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">Notifiche non supportate</h4>
                  <p className="text-sm text-muted-foreground mt-1">
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