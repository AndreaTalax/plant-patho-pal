
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Settings, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  LogOut, 
  History, 
  ShoppingBag, 
  Flower2,
  User,
  Save,
  Edit
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import PrivacyPolicyModal from "./PrivacyPolicyModal";
import SettingsModal from "./SettingsModal";
import ChangeCredentialsModal from "./ChangeCredentialsModal";

const ProfileTab = () => {
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [addressValue, setAddressValue] = useState("");
  
  const navigate = useNavigate();
  const { logout, userProfile, updateProfile } = useAuth();
  const { toast } = useToast();

  // Initialize state with user profile data
  useState(() => {
    setPhoneValue(userProfile.phone || "");
    setAddressValue(userProfile.address || "");
  });

  const handleSignOut = () => {
    logout();
    toast({
      title: "Disconnesso con successo",
      description: "Sei stato disconnesso dal tuo account",
    });
    navigate("/login");
  };

  const handleSavePhone = () => {
    updateProfile("phone", phoneValue);
    setEditingPhone(false);
    toast({
      title: "Numero di telefono aggiornato",
      description: "Il tuo numero di telefono è stato salvato con successo",
    });
  };

  const handleSaveAddress = () => {
    updateProfile("address", addressValue);
    setEditingAddress(false);
    toast({
      title: "Indirizzo aggiornato",
      description: "Il tuo indirizzo è stato salvato con successo",
    });
  };

  const getInitials = () => {
    const firstName = userProfile.firstName || "";
    const lastName = userProfile.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src="/placeholder.svg" alt="User avatar" />
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold text-gray-900">
          {userProfile.firstName} {userProfile.lastName}
        </h2>
        <p className="text-gray-500">{userProfile.email}</p>
      </div>

      {/* Activity Section */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold">Activity</h3>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="diagnosis" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
            </TabsList>
            <TabsContent value="diagnosis" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5 text-drplant-blue" />
                  <div>
                    <h4 className="font-medium">Rose Black Spot</h4>
                    <p className="text-sm text-gray-500">Diagnosed on April 15, 2025</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">View Details</Button>
              </div>
            </TabsContent>
            <TabsContent value="orders" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5 text-drplant-blue" />
                  <div>
                    <h4 className="font-medium">Organic Fungicide</h4>
                    <p className="text-sm text-gray-500">Ordered on April 16, 2025</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Track Order</Button>
              </div>
            </TabsContent>
            <TabsContent value="saved" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Flower2 className="h-5 w-5 text-drplant-blue" />
                  <div>
                    <h4 className="font-medium">Tomato Plant Care</h4>
                    <p className="text-sm text-gray-500">Saved on April 14, 2025</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">View Guide</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Personal Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold">Informazioni Personali</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-gray-600">
            <Mail className="h-5 w-5 flex-shrink-0" />
            <span className="flex-grow">{userProfile.email}</span>
          </div>
          
          <div className="flex items-center gap-3 text-gray-600">
            <Phone className="h-5 w-5 flex-shrink-0" />
            {editingPhone ? (
              <div className="flex-grow flex gap-2">
                <Input 
                  value={phoneValue} 
                  onChange={(e) => setPhoneValue(e.target.value)}
                  placeholder="Inserisci numero di telefono"
                  className="flex-grow"
                />
                <Button size="icon" onClick={handleSavePhone}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <span className="flex-grow">{userProfile.phone || "Non specificato"}</span>
                <Button variant="ghost" size="icon" onClick={() => setEditingPhone(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-gray-600">
            <MapPin className="h-5 w-5 flex-shrink-0" />
            {editingAddress ? (
              <div className="flex-grow flex gap-2">
                <Input 
                  value={addressValue} 
                  onChange={(e) => setAddressValue(e.target.value)}
                  placeholder="Inserisci indirizzo"
                  className="flex-grow"
                />
                <Button size="icon" onClick={handleSaveAddress}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <span className="flex-grow">{userProfile.address || "Non specificato"}</span>
                <Button variant="ghost" size="icon" onClick={() => setEditingAddress(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => setSettingsOpen(true)}>
          <Settings className="mr-2" />
          Impostazioni
        </Button>
        <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => setPrivacyPolicyOpen(true)}>
          <Shield className="mr-2" />
          Privacy Policy
        </Button>
        <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => setCredentialsOpen(true)}>
          <User className="mr-2" />
          Cambia Username & Password
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
          size="lg"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2" />
          Esci
        </Button>
      </div>

      {/* Modals */}
      <PrivacyPolicyModal open={privacyPolicyOpen} onOpenChange={setPrivacyPolicyOpen} />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ChangeCredentialsModal open={credentialsOpen} onOpenChange={setCredentialsOpen} />
    </div>
  );
};

export default ProfileTab;
