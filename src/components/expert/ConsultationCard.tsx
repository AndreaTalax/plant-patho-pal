
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ConsultationCardProps {
  consultation: any;
  getInitials: (firstName?: string, lastName?: string) => string;
  getUserDisplayName: (userProfile?: { first_name: string; last_name: string; email: string } | null) => string;
  getStatusBadge: (status: string) => JSX.Element;
  updateConsultationStatus: (consultationId: string, newStatus: string) => void;
  deletingConsultation: string | null;
  handleDeleteConsultation: (consultationId: string) => void;
}

export default function ConsultationCard({
  consultation,
  getInitials,
  getUserDisplayName,
  getStatusBadge,
  updateConsultationStatus,
  deletingConsultation,
  handleDeleteConsultation,
}: ConsultationCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {getInitials(consultation.user_profile?.first_name, consultation.user_profile?.last_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {getUserDisplayName(consultation.user_profile)}
              </div>
              <div className="text-sm text-gray-500">{consultation.user_profile?.email || 'Email non disponibile'}</div>
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge(consultation.status)}
            {/* Pulsante Elimina - Solo per admin */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  disabled={deletingConsultation === consultation.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Elimina Consultazione</AlertDialogTitle>
                  <AlertDialogDescription>
                    Sei sicuro di voler eliminare questa consultazione di {getUserDisplayName(consultation.user_profile)}? 
                    Questa azione non può essere annullata.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDeleteConsultation(consultation.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Elimina
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Sintomi:</h4>
          <p className="text-gray-700">{consultation.symptoms || 'Nessun sintomo specificato'}</p>
        </div>
        {consultation.plant_info && (
          <div>
            <h4 className="font-medium mb-2">Informazioni Pianta:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Ambiente: {consultation.plant_info.isIndoor ? 'Interno' : 'Esterno'}</div>
              <div>Irrigazione: {consultation.plant_info.wateringFrequency || 'Non specificata'} volte/settimana</div>
              <div>Esposizione luce: {consultation.plant_info.lightExposure || 'Non specificata'}</div>
            </div>
          </div>
        )}
        {consultation.image_url && (
          <div>
            <h4 className="font-medium mb-2">Immagine:</h4>
            <img 
              src={consultation.image_url} 
              alt="Pianta" 
              className="w-32 h-32 object-cover rounded-lg"
            />
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          {formatDistanceToNow(new Date(consultation.created_at), { 
            addSuffix: true, 
            locale: it 
          })}
        </div>
        <div className="flex gap-2">
          {consultation.status === 'pending' && (
            <Button
              onClick={() => updateConsultationStatus(consultation.id, 'in_progress')}
              size="sm"
            >
              Prendi in Carico
            </Button>
          )}
          {consultation.status === 'in_progress' && (
            <Button
              onClick={() => updateConsultationStatus(consultation.id, 'completed')}
              size="sm"
              variant="outline"
            >
              Segna come Completato
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
