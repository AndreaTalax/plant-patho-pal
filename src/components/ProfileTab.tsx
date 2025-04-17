
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Settings, Mail, Phone, MapPin, Shield, LogOut } from "lucide-react";

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

      {/* Profile Cards */}
      <div className="space-y-4">
        {/* Personal Info */}
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
    </div>
  );
};

export default ProfileTab;
