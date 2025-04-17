
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Settings, Mail, Phone, MapPin, Shield, LogOut, History, ShoppingBag, Flower2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProfileTab = () => {
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col items-center pt-8 pb-6">
        <Avatar className="h-24 w-24 mb-4">
          <AvatarImage src="/placeholder.svg" alt="User avatar" />
          <AvatarFallback>GP</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-bold text-gray-900">Guest Profile</h2>
        <p className="text-gray-500">Plant enthusiast</p>
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
            <Mail className="h-5 w-5" />
            <span>guest@example.com</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Phone className="h-5 w-5" />
            <span>Not provided</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <MapPin className="h-5 w-5" />
            <span>Not provided</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button variant="outline" className="w-full justify-start" size="lg">
          <Settings className="mr-2" />
          Settings
        </Button>
        <Button variant="outline" className="w-full justify-start" size="lg">
          <Shield className="mr-2" />
          Privacy Policy
        </Button>
        <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" size="lg">
          <LogOut className="mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default ProfileTab;
