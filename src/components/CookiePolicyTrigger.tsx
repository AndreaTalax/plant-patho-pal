import { useState } from "react";
import CookiePolicyModal from "./CookiePolicyModal";

const CookiePolicyTrigger = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-drplant-blue hover:underline font-medium"
      >
        Cookie Policy
      </button>
      <CookiePolicyModal open={open} onOpenChange={setOpen} />
    </>
  );
};

export default CookiePolicyTrigger;
