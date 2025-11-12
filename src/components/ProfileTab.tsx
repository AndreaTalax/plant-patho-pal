import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import PrivacyPolicyModal from "./PrivacyPolicyModal";
import SettingsModal from "./SettingsModal";
import ChangeCredentialsModal from "./ChangeCredentialsModal";
import { DiagnosisHistory } from "./diagnose/DiagnosisHistory";
import { supabase } from "@/integrations/supabase/client";

const PHONE_PREFIXES = [
  { code: '+39', country: 'Italia', flag: '🇮🇹' },
  { code: '+1', country: 'USA/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+30', country: 'Greece', flag: '🇬🇷' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
];

interface Order {
  id: string;
  amount: number;
  currency: string;
  status: string;
  items: any[];
  created_at: string;
}

/**
* This component manages the user's profile including personal information, orders, and avatar.
* @example
* ProfileTab()
* Returns a JSX element for displaying and interacting with user profile data.
* @param {none} No explicit parameters as it relies on hooks and context.
* @returns {JSX.Element} Renders the UI for the user's profile including hero image, activity tabs, personal information, and actions like sign out.
* @description
*   - Initializes component state based on user profile context.
*   - Handles asynchronous operations for fetching orders and updating profile information.
*   - Detailed tabbed interface to navigate through user orders, diagnoses, and saved articles.
*   - Validates avatar image before upload and updates upon successful upload.
*/
const ProfileTab = () => {
  const [privacyPolicyOpen, setPrivacyPolicyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [showDiagnosisHistory, setShowDiagnosisHistory] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [phonePrefix, setPhonePrefix] = useState("+39");
  const [phoneValue, setPhoneValue] = useState("");
  const [addressValue, setAddressValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { logout, userProfile, updateProfile } = useAuth();

  // Funzione per recuperare il giusto campo dal profilo anche con snake_case
  const getField = (field: string, altField?: string) => {
    if (!userProfile) return "";
    return (
      userProfile[field] ||
      userProfile[altField || ""] ||
      userProfile[field.replace(/([A-Z])/g, "_$1").toLowerCase()] ||
      ""
    );
  };

  // Initialize state with user profile data
  useEffect(() => {
    setPhoneValue(getField("phone"));
    setAddressValue(getField("address"));
    fetchOrders();
  }, [userProfile]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-user-orders');
      if (error) throw error;
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSignOut = () => {
    logout();
    toast("You have been disconnected from your account");
    navigate("/login");
  };

  const handleSavePhone = async () => {
    try {
      const fullPhone = `${phonePrefix} ${phoneValue}`;
      await updateProfile("phone", fullPhone);
      setEditingPhone(false);
      toast("Phone number updated");
    } catch (error) {
      toast("Failed to update phone number");
    }
  };

  const handleSaveAddress = async () => {
    try {
      await updateProfile("address", addressValue);
      setEditingAddress(false);
      toast("Address updated");
    } catch (error) {
      toast("Failed to update address");
    }
  };

  const getInitials = () => {
    const firstName = getField("firstName", "first_name");
    const lastName = getField("lastName", "last_name");
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };
  
  /**
  * Handles image file upload from user input and updates user profile picture.
  * @example
  * sync(event)
  * Uploads the selected image file and updates the profile picture.
  * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event containing the selected files.
  * @returns {void} No return value.
  * @description
  *   - Validates that the selected file is an image, and its size is less than 5MB.
  *   - Uses the uploadAvatarImage utility function instead of Supabase function.
  *   - Provides user feedback through toast notifications for success and error states.
  *   - Resets file input value and uploading state after the operation.
  */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      
      const file = event.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast("Please select an image file");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast("File size must be less than 5MB");
        return;
      }
      
      setUploading(true);
      
      // Use the utility function instead of Supabase function
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Import and use the utility function
      const { uploadAvatarImage } = await import('@/utils/imageStorage');
      const avatarUrl = await uploadAvatarImage(file, user.id);
      
      // Update the user's profile in the database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Update the user's profile in context
      await updateProfile("avatarUrl", avatarUrl);
      
      toast("Profile picture updated successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast("Error uploading image. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  
  // Show diagnosis history if requested
  if (showDiagnosisHistory) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-4 pt-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowDiagnosisHistory(false)}
            className="p-2"
          >
            ← Back to Profile
          </Button>
        </div>
        <DiagnosisHistory />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <div className="relative">
          <Avatar className="h-24 w-24 mb-4 cursor-pointer" onClick={handleAvatarClick}>
            <AvatarImage src={getField("avatarUrl", "avatar_url") || "/placeholder.svg"} alt="User avatar" />
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
          {getField("firstName", "first_name")} {getField("lastName", "last_name")}
        </h2>
        <p className="text-gray-500">{getField("email")}</p>
        {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
      </div>

      {/* Activity Section */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold">Activity</h3>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
            </TabsList>
            <TabsContent value="orders" className="space-y-4 mt-4">
              {loadingOrders ? (
                <div className="text-center py-4">Loading orders...</div>
              ) : orders.length > 0 ? (
                orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-5 w-5 text-drplant-blue" />
                      <div>
                        <h4 className="font-medium">Order #{order.id.slice(0, 8)}</h4>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()} - €{(order.amount / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <Badge className={order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {order.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">No orders yet</div>
              )}
            </TabsContent>
            <TabsContent value="diagnosis" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5 text-drplant-blue" />
                  <div>
                    <h4 className="font-medium">Recent Diagnoses</h4>
                    <p className="text-sm text-gray-500">View your plant diagnosis history</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowDiagnosisHistory(true)}>View All</Button>
              </div>
            </TabsContent>
            <TabsContent value="saved" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Flower2 className="h-5 w-5 text-drplant-blue" />
                  <div>
                    <h4 className="font-medium">Saved Articles</h4>
                    <p className="text-sm text-gray-500">Your bookmarked content</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/saved-articles')}>View Saved</Button>
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
            <span className="flex-grow">{getField("email")}</span>
          </div>
          
          <div className="flex items-center gap-3 text-gray-600">
            <Phone className="h-5 w-5 flex-shrink-0" />
            {editingPhone ? (
              <div className="flex-grow flex gap-2">
                <Select value={phonePrefix} onValueChange={setPhonePrefix}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHONE_PREFIXES.map((prefix) => (
                      <SelectItem key={prefix.code} value={prefix.code}>
                        {prefix.flag} {prefix.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input 
                  value={phoneValue} 
                  onChange={(e) => setPhoneValue(e.target.value)}
                  placeholder="xxx xxx xxxx"
                  className="flex-grow"
                />
                <Button size="icon" onClick={handleSavePhone}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <span className="flex-grow">{getField("phone") || "Not specified"}</span>
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
                <span className="flex-grow">{addressValue || "Not specified"}</span>
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
