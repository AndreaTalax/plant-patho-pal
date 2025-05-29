
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
