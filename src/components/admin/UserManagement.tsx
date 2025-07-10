import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { UserRoleService, useUserRoles } from '@/services/userRoleService';
import { toast } from 'sonner';
import { Shield, User, Crown, Star, Lock, Unlock } from 'lucide-react';

export function UserManagement() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testUsers, setTestUsers] = useState<any[]>([]);
  const currentUserRoles = useUserRoles();

  useEffect(() => {
    loadTestUsers();
  }, []);

  const loadTestUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (
            role
          ),
          subscribers (
            subscribed,
            subscription_tier,
            subscription_end
          )
        `)
        .in('email', ['test@gmail.com', 'talaiaandrea@gmail.com']);

      if (error) {
        console.error('Error loading test users:', error);
        return;
      }

      setTestUsers(data || []);
    } catch (error) {
      console.error('Error in loadTestUsers:', error);
    }
  };

  const testLogin = async (testEmail: string, testPassword?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword || 'test123'
      });

      if (error) {
        toast.error(`Errore login ${testEmail}: ${error.message}`);
        console.error('Login error:', error);
      } else {
        toast.success(`Login riuscito per ${testEmail}`);
        console.log('Login successful:', data);
        
        // Refresh user data
        await loadTestUsers();
      }
    } catch (error) {
      console.error('Login test error:', error);
      toast.error('Errore durante il test di login');
    } finally {
      setIsLoading(false);
    }
  };

  const manualLogin = async () => {
    if (!email || !password) {
      toast.error('Inserisci email e password');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast.error(`Errore login: ${error.message}`);
        console.error('Manual login error:', error);
      } else {
        toast.success(`Login riuscito per ${email}`);
        console.log('Manual login successful:', data);
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      console.error('Manual login error:', error);
      toast.error('Errore durante il login');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logout effettuato');
      await loadTestUsers();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Errore durante il logout');
    }
  };

  const resetPassword = async (userEmail: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        toast.error(`Errore reset password: ${error.message}`);
      } else {
        toast.success(`Email di reset inviata a ${userEmail}`);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Errore durante il reset password');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'expert': return <Star className="h-4 w-4" />;
      case 'premium': return <Crown className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'expert': return 'bg-purple-500';
      case 'premium': return 'bg-yellow-500';
      case 'user': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Gestione Utenti</h1>
        <p className="text-muted-foreground">Test e configurazione degli utenti del sistema</p>
      </div>

      {/* Current User Info */}
      {!currentUserRoles.loading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Utente Corrente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentUserRoles.roles.length > 0 ? (
                currentUserRoles.roles.map((role) => (
                  <Badge key={role} variant="default" className="flex items-center gap-1">
                    {getRoleIcon(role)}
                    {role}
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary">Nessun ruolo assegnato</Badge>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={logout} variant="outline">
                <Unlock className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Login Test */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Test Admin (test@gmail.com)
            </CardTitle>
            <CardDescription>
              Utente con funzionalità complete - Admin, Expert, Premium
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => testLogin('test@gmail.com')}
              disabled={isLoading}
              className="w-full"
            >
              <Lock className="h-4 w-4 mr-2" />
              Login come Admin
            </Button>
            <Button 
              onClick={() => resetPassword('test@gmail.com')}
              variant="outline"
              className="w-full mt-2"
            >
              Reset Password
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Test User (talaiaandrea@gmail.com)
            </CardTitle>
            <CardDescription>
              Utente normale con funzionalità base
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => testLogin('talaiaandrea@gmail.com', 'test123')}
              disabled={isLoading}
              className="w-full"
            >
              <Lock className="h-4 w-4 mr-2" />
              Login come User
            </Button>
            <Button 
              onClick={() => resetPassword('talaiaandrea@gmail.com')}
              variant="outline"
              className="w-full mt-2"
            >
              Reset Password
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Manual Login */}
      <Card>
        <CardHeader>
          <CardTitle>Login Manuale</CardTitle>
          <CardDescription>Testa il login con credenziali personalizzate</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Inserisci email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Inserisci password"
              />
            </div>
          </div>
          <Button 
            onClick={manualLogin}
            disabled={isLoading || !email || !password}
            className="w-full"
          >
            <Lock className="h-4 w-4 mr-2" />
            Login
          </Button>
        </CardContent>
      </Card>

      {/* Test Users Status */}
      <Card>
        <CardHeader>
          <CardTitle>Stato Utenti di Test</CardTitle>
          <CardDescription>Configurazione e ruoli degli utenti di test</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testUsers.map((user) => (
              <div key={user.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getRoleColor(user.role)} text-white`}>
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <p className="font-medium">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{user.role}</Badge>
                    <Badge variant={user.subscription_plan === 'premium' ? 'default' : 'secondary'}>
                      {user.subscription_plan}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {user.user_roles?.map((roleData: any, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {roleData.role}
                    </Badge>
                  ))}
                </div>

                {user.subscribers && user.subscribers.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Sottoscrizione: {user.subscribers[0].subscribed ? 'Attiva' : 'Inattiva'}
                    {user.subscribers[0].subscription_end && (
                      <span> - Scade: {new Date(user.subscribers[0].subscription_end).toLocaleDateString('it-IT')}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}