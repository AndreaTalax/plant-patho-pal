
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, LockKeyhole } from "lucide-react";
import { CardContent, CardFooter } from "@/components/ui/card";

interface AuthFormFieldsProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  mode: 'login' | 'signup';
  onSubmit: (e: React.FormEvent) => void;
  toggleMode: () => void;
  isLoading: boolean;
}

export function AuthFormFields({
  email,
  setEmail,
  password,
  setPassword,
  mode,
  onSubmit,
  toggleMode,
  isLoading
}: AuthFormFieldsProps) {
  return (
    <form onSubmit={onSubmit}>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@esempio.com"
              className="pl-10"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <div className="relative">
            <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Minimo 6 caratteri' : '••••••••'}
              className="pl-10"
              required
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading
            ? mode === 'login' ? 'Accesso in corso...' : 'Registrazione in corso...'
            : mode === 'login' ? 'Accedi' : 'Registrati'}
        </Button>
        <div className="text-sm text-center">
          {mode === 'login' ? (
            <span>Non hai un account? <button type="button" className="text-drplant-blue hover:underline" onClick={toggleMode}>Registrati</button></span>
          ) : (
            <span>Hai già un account? <button type="button" className="text-drplant-blue hover:underline" onClick={toggleMode}>Accedi</button></span>
          )}
        </div>
      </CardFooter>
    </form>
  );
}
