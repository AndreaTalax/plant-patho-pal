
import { supabase } from '@/integrations/supabase/client';

// Funzione di registrazione utente
export const signUp = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      }
    });

    if (error) {
      console.error('Errore registrazione:', error.message);
      throw error;
    } else {
      console.log('Email inviata a:', email);
      return data;
    }
  } catch (error: any) {
    console.error('Errore durante la registrazione:', error);
    throw error;
  }
};

// Funzione di login utente
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Errore login:', error.message);
      throw error;
    } else {
      console.log('Login effettuato con successo');
      return data;
    }
  } catch (error: any) {
    console.error('Errore durante il login:', error);
    throw error;
  }
};

// Funzione di logout utente
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Errore logout:', error.message);
      throw error;
    } else {
      console.log('Logout effettuato con successo');
    }
  } catch (error: any) {
    console.error('Errore durante il logout:', error);
    throw error;
  }
};
