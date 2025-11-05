import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

const PaymentCanceled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-drplant-blue-light via-white to-drplant-green/10 flex flex-col items-center justify-center px-4">
      <div className="absolute top-0 left-0 w-full h-64 bg-drplant-blue-light/30 -z-10 rounded-b-[50%]" />
      <div className="absolute bottom-0 right-0 w-full h-64 bg-drplant-green/20 -z-10 rounded-t-[30%]" />

      <Card className="max-w-md w-full border-none shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <XCircle className="h-16 w-16 mx-auto mb-4 text-orange-500" />
          <CardTitle className="text-2xl text-drplant-blue-dark">
            Pagamento Annullato
          </CardTitle>
          <CardDescription>
            Il processo di pagamento è stato annullato
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Non ti preoccupare, nessun addebito è stato effettuato.
          </p>
          <p className="text-gray-600">
            Puoi riprovare in qualsiasi momento o scegliere un altro piano.
          </p>
          <div className="space-y-2">
            <Button
              onClick={() => navigate("/plan-subscription-selection")}
              className="w-full bg-gradient-to-r from-drplant-green to-drplant-green-dark"
            >
              Torna ai Piani
            </Button>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full"
            >
              Torna alla Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCanceled;
