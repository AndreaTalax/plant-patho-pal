
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface SecurityGuidelinesProps {
  showOtpGuidelines?: boolean;
}

const SecurityGuidelines: React.FC<SecurityGuidelinesProps> = ({ 
  showOtpGuidelines = true 
}) => {
  return (
    <div className="space-y-4 my-6">
      <h3 className="text-lg font-semibold text-gray-800">Security Guidelines</h3>
      
      {showOtpGuidelines && (
        <Alert variant="default">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>About One-Time Passwords (OTP)</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
              <li>OTPs now expire after 15 minutes for enhanced security</li>
              <li>Use verification codes immediately after receiving them</li>
              <li>Never share your OTP with anyone, including Dr.Plant support</li>
              <li>If you didn't request an OTP, please secure your account immediately</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      <Alert variant="default">
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Account Protection</AlertTitle>
        <AlertDescription>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
            <li>Use a strong, unique password for your Dr.Plant account</li>
            <li>Enable two-factor authentication if available</li>
            <li>Review your account activity regularly</li>
            <li>Log out of your account when using shared devices</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SecurityGuidelines;
