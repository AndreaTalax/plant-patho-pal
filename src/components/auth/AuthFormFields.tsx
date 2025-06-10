
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

/**
 * Renders an authentication form with fields for email and password.
 * @example
 * <AuthFormFields
 *   email=""
 *   setEmail={() => {}}
 *   password=""
 *   setPassword={() => {}}
 *   mode="login"
 *   onSubmit={() => {}}
 *   toggleMode={() => {}}
 *   isLoading={false}
 * />
 * @param {string} email - User's email address.
 * @param {function} setEmail - Function to update the email state.
 * @param {string} password - User's password.
 * @param {function} setPassword - Function to update the password state.
 * @param {string} mode - Current form mode, either 'login' or 'signup'.
 * @param {function} onSubmit - Function to handle form submission.
 * @param {function} toggleMode - Function to toggle between login and signup modes.
 * @param {boolean} isLoading - Boolean indicating if the form is in a loading state.
 * @returns {JSX.Element} The rendered authentication form component.
 * @description
 *   - Displays a loading indicator on the submit button when `isLoading` is true.
 *   - Automatically updates placeholder text and button label based on `mode`.
 *   - Provides a toggle option between login and signup modes.
 */
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
              placeholder="name@example.com"
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
              placeholder={mode === 'signup' ? 'Minimum 6 characters' : '••••••••'}
              className="pl-10"
              required
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading
            ? mode === 'login' ? 'Logging in...' : 'Registering...'
            : mode === 'login' ? 'Login' : 'Register'}
        </Button>
        <div className="text-sm text-center">
          {mode === 'login' ? (
            <span>Don't have an account? <button type="button" className="text-drplant-blue hover:underline" onClick={toggleMode}>Register</button></span>
          ) : (
            <span>Already have an account? <button type="button" className="text-drplant-blue hover:underline" onClick={toggleMode}>Login</button></span>
          )}
        </div>
      </CardFooter>
    </form>
  );
}
