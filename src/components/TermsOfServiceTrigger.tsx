import { useState } from "react";
import TermsOfServiceModal from "./TermsOfServiceModal";

const TermsOfServiceTrigger = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-drplant-blue hover:underline font-medium"
      >
        Termini di Servizio
      </button>
      <TermsOfServiceModal open={open} onOpenChange={setOpen} />
    </>
  );
};

export default TermsOfServiceTrigger;