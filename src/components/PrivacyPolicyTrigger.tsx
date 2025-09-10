import { useState } from "react";
import PrivacyPolicyModal from "./PrivacyPolicyModal";

const PrivacyPolicyTrigger = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-drplant-blue hover:underline font-medium"
      >
        Privacy Policy
      </button>
      <PrivacyPolicyModal open={open} onOpenChange={setOpen} />
    </>
  );
};

export default PrivacyPolicyTrigger;