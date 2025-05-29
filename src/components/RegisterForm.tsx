import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(`Errore: ${error.message}`);
    } else {
      setMessage('Registrazione completata! Controlla la tua email per confermare.');
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4 p-4">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="border p-2 w-full"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="border p-2 w-full"
      />
      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
        Registrati
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}
