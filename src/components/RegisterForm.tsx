import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function LoginForm() {
  const [email, setEmail] = useState('test@gmail.com');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Login automatico per test@gmail.com (password da impostare qui)
  useEffect(() => {
    const autoLogin = async () => {
      if (email === 'test@gmail.com') {
        setLoading(true);
        setMessage('');
        // Imposta qui la password di test@gmail.com
        const testPassword = 'test123'; // Sostituisci con la password corretta
        
        const { error } = await supabase.auth.signInWithPassword({
          email: 'test@gmail.com',
          password: testPassword,
        });

        setLoading(false);
        if (error) {
          setMessage(`❌ Errore login automatico: ${error.message}`);
        } else {
          setMessage('✅ Login automatico riuscito!');
        }
      }
    };

    autoLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(`❌ Errore: ${error.message}`);
    } else {
      setMessage('✅ Login effettuato con successo!');
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4 p-4 max-w-md mx-auto">
      <h2 className="text-lg font-semibold">Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="border p-2 w-full rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        className="border p-2 w-full rounded"
      />
      <button
        type="submit"
        disabled={loading}
        className={`w-full px-4 py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
      >
        {loading ? 'Accesso in corso...' : 'Accedi'}
      </button>
      {message && <p className="text-sm text-center">{message}</p>}
    </form>
  );
}
