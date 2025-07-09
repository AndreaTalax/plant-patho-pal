import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMessagesCDC, useConversationsCDC, useDiagnosesCDC, useConsultationsCDC } from '@/hooks/useCDCRealtime';
import { CDCService } from '@/services/cdcService';
import { RefreshCw, Database, Zap, Activity, Users, MessageSquare, Stethoscope, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function CDCDashboard() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalStats, setGlobalStats] = useState<{
    processed_count: number;
    total_events: number;
  } | null>(null);

  // CDC hooks for different tables
  const messagesCDC = useMessagesCDC(true);
  const conversationsCDC = useConversationsCDC(true);
  const diagnosesCDC = useDiagnosesCDC(true);
  const consultationsCDC = useConsultationsCDC(true);

  const allConnections = [
    { name: 'Messages', status: messagesCDC.isConnected, icon: MessageSquare, color: 'bg-blue-500' },
    { name: 'Conversations', status: conversationsCDC.isConnected, icon: Users, color: 'bg-green-500' },
    { name: 'Diagnoses', status: diagnosesCDC.isConnected, icon: Stethoscope, color: 'bg-purple-500' },
    { name: 'Consultations', status: consultationsCDC.isConnected, icon: FileText, color: 'bg-orange-500' }
  ];

  const processAllEvents = async () => {
    setIsProcessing(true);
    try {
      const stats = await CDCService.processEvents();
      setGlobalStats(stats);
      toast.success(`Elaborati ${stats.processed_count} eventi su ${stats.total_events}`);
    } catch (error) {
      console.error('Error processing events:', error);
      toast.error('Errore durante l\'elaborazione degli eventi');
    } finally {
      setIsProcessing(false);
    }
  };

  const getEventIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      default: return '🔄';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('it-IT');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CDC Dashboard</h1>
          <p className="text-muted-foreground">Monitor Change Data Capture events in real-time</p>
        </div>
        <Button 
          onClick={processAllEvents} 
          disabled={isProcessing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
          {isProcessing ? 'Processing...' : 'Process Events'}
        </Button>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {allConnections.map((connection) => (
          <Card key={connection.name}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${connection.color} text-white`}>
                  <connection.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{connection.name}</p>
                  <Badge variant={connection.status ? "default" : "secondary"}>
                    {connection.status ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Global Stats */}
      {globalStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Processing Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{globalStats.processed_count}</p>
                <p className="text-sm text-muted-foreground">Events Processed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{globalStats.total_events}</p>
                <p className="text-sm text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events by Table */}
      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="messages">Messages ({messagesCDC.events.length})</TabsTrigger>
          <TabsTrigger value="conversations">Conversations ({conversationsCDC.events.length})</TabsTrigger>
          <TabsTrigger value="diagnoses">Diagnoses ({diagnosesCDC.events.length})</TabsTrigger>
          <TabsTrigger value="consultations">Consultations ({consultationsCDC.events.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="messages">
          <EventsList 
            title="Messages Events" 
            events={messagesCDC.events}
            lastProcessed={messagesCDC.lastProcessed}
            stats={messagesCDC.processingStats}
            getEventIcon={getEventIcon}
            formatTimestamp={formatTimestamp}
          />
        </TabsContent>

        <TabsContent value="conversations">
          <EventsList 
            title="Conversations Events" 
            events={conversationsCDC.events}
            lastProcessed={conversationsCDC.lastProcessed}
            stats={conversationsCDC.processingStats}
            getEventIcon={getEventIcon}
            formatTimestamp={formatTimestamp}
          />
        </TabsContent>

        <TabsContent value="diagnoses">
          <EventsList 
            title="Diagnoses Events" 
            events={diagnosesCDC.events}
            lastProcessed={diagnosesCDC.lastProcessed}
            stats={diagnosesCDC.processingStats}
            getEventIcon={getEventIcon}
            formatTimestamp={formatTimestamp}
          />
        </TabsContent>

        <TabsContent value="consultations">
          <EventsList 
            title="Consultations Events" 
            events={consultationsCDC.events}
            lastProcessed={consultationsCDC.lastProcessed}
            stats={consultationsCDC.processingStats}
            getEventIcon={getEventIcon}
            formatTimestamp={formatTimestamp}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface EventsListProps {
  title: string;
  events: any[];
  lastProcessed: Date | null;
  stats: any;
  getEventIcon: (operation: string) => string;
  formatTimestamp: (timestamp: string) => string;
}

function EventsList({ 
  title, 
  events, 
  lastProcessed, 
  stats, 
  getEventIcon, 
  formatTimestamp 
}: EventsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          {lastProcessed && `Last processed: ${formatTimestamp(lastProcessed.toISOString())}`}
          {stats && ` | Processed: ${stats.processed_count}/${stats.total_events}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No events yet</p>
          ) : (
            events.map((event, index) => (
              <div key={event.id || index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getEventIcon(event.operation)}</span>
                  <div>
                    <p className="font-medium">{event.operation} on {event.table_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTimestamp(event.occurred_at)}
                    </p>
                  </div>
                </div>
                <Badge variant={event.processed ? "default" : "secondary"}>
                  {event.processed ? 'Processed' : 'Pending'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}