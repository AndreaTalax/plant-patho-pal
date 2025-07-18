
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserInfo {
  nome: string;
  cognome: string;
  email: string;
}

interface UserInfoFormProps {
  onComplete: (data: UserInfo) => void;
}

/**
 * Renders a user information form and handles form submission.
 * @example
 * UserInfoForm({ onComplete: handleFormComplete })
 * // The form will render with fields for 'nome', 'cognome', 'email' and call `handleFormComplete` with form data upon submission.
 * @param {UserInfoFormProps} {onComplete} - Function to call with form data upon form completion.
 * @returns {JSX.Element} JSX element representing the form UI.
 * @description
 *   - Uses internal state to manage form data for 'nome', 'cognome', and 'email'.
 *   - Updates form data state on input changes using `handleChange`.
 *   - Prevents default form submission behavior and triggers provided `onComplete` function.
 */
const UserInfoForm = ({ onComplete }: UserInfoFormProps) => {
  const [formData, setFormData] = useState<UserInfo>({
    nome: '',
    cognome: '',
    email: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  const handleChange = (field: keyof UserInfo, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          value={formData.nome}
          onChange={(e) => handleChange('nome', e.target.value)}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="cognome">Cognome</Label>
        <Input
          id="cognome"
          value={formData.cognome}
          onChange={(e) => handleChange('cognome', e.target.value)}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          required
        />
      </div>
      
      <Button type="submit" className="w-full">
        Continua
      </Button>
    </form>
  );
};

export default UserInfoForm;
