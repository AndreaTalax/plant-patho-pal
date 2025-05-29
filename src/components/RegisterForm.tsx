import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(`❌ Errore: ${error.message}`);
    } else {
      setMessage('✅ Registrazione completata! Controlla la tua email per confermare.');
      setEmail('');
      setPassword('');
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4 p-4 max-w-md mx-auto">
      <h2 className="text-lg font-semibold">Registrazione</h2>
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
        {loading ? 'Registrazione in corso...' : 'Registrati'}
      </button>
      {message && <p className="text-sm text-center">{message}</p>}
    </form>
  );
}
