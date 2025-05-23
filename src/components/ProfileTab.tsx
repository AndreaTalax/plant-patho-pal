
import { useState, useRef } from "react";
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
  Edit,
  Camera
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import PrivacyPolicyModal from "./PrivacyPolicyModal";
import SettingsModal from "./SettingsModal";
import ChangeCredentialsModal from "./ChangeCredentialsModal";
import { supabase } from "@/integrations/supabase/client";

const ProfileTab = () => {
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [addressValue, setAddressValue] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { logout, userProfile, updateProfile } = useAuth();

  // Initialize state with user profile data
  useState(() => {
    setPhoneValue(userProfile.phone || "");
    setAddressValue(userProfile.address || "");
    setAvatarUrl(userProfile.avatarUrl || null);
  });

  const handleSignOut = () => {
    logout();
    toast("You have been disconnected from your account");
    navigate("/login");
  };

  const handleSavePhone = () => {
    updateProfile("phone", phoneValue);
    setEditingPhone(false);
    toast("Phone number updated");
  };

  const handleSaveAddress = () => {
    updateProfile("address", addressValue);
    setEditingAddress(false);
    toast("Address updated");
  };

  const getInitials = () => {
    const firstName = userProfile.firstName || "";
    const lastName = userProfile.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      
      if (!userProfile.id) {
        toast("User profile not properly loaded");
        return;
      }
      
      const filePath = `${userProfile.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      setUploading(true);
      
      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(filePath);
        
      const newAvatarUrl = data.publicUrl;
      
      // Update the user's profile
      await updateProfile("avatarUrl", newAvatarUrl);
      setAvatarUrl(newAvatarUrl);
      
      toast("Profile picture updated");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast("Error uploading image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <div className="relative">
          <Avatar className="h-24 w-24 mb-4 cursor-pointer" onClick={handleAvatarClick}>
            <AvatarImage src={avatarUrl || "/placeholder.svg"} alt="User avatar" />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
          <Button 
            size="icon" 
            className="absolute bottom-3 right-0 rounded-full h-8 w-8" 
            variant="outline"
            onClick={handleAvatarClick}
            disabled={uploading}
          >
            <Camera className="h-4 w-4" />
          </Button>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
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
          <h3 className="text-lg font-semibold">Personal Information</h3>
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
                  placeholder="Enter phone number"
                  className="flex-grow"
                />
                <Button size="icon" onClick={handleSavePhone}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <span className="flex-grow">{userProfile.phone || "Not specified"}</span>
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
                  placeholder="Enter address"
                  className="flex-grow"
                />
                <Button size="icon" onClick={handleSaveAddress}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <span className="flex-grow">{userProfile.address || "Not specified"}</span>
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
          Settings
        </Button>
        <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => setPrivacyPolicyOpen(true)}>
          <Shield className="mr-2" />
          Privacy Policy
        </Button>
        <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => setCredentialsOpen(true)}>
          <User className="mr-2" />
          Change Username & Password
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" 
          size="lg"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2" />
          Sign Out
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
