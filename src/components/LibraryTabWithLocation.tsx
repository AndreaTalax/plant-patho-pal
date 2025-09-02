import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book, MapPin, Leaf, Calendar, Star } from 'lucide-react';
import LibraryTab from './LibraryTab';
import NativePlantsPanel from './location/NativePlantsPanel';

export const LibraryTabWithLocation = () => {
  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="articles" className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            Articoli
          </TabsTrigger>
          <TabsTrigger value="native-plants" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Piante Locali
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="mt-6">
          <LibraryTab />
        </TabsContent>

        <TabsContent value="native-plants" className="mt-6 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-6 w-6 text-primary" />
                  Piante Native della Tua Zona
                </CardTitle>
                <p className="text-muted-foreground">
                  Scopri le piante autoctone che crescono naturalmente nella tua area geografica.
                  Ogni pianta è adattata al clima e all'ecosistema locale.
                </p>
              </CardHeader>
            </Card>

            {/* Features info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Geolocalizzazione</h3>
                  <p className="text-sm text-muted-foreground">
                    Basato sulla tua posizione geografica
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Periodi di Fioritura</h3>
                  <p className="text-sm text-muted-foreground">
                    Informazioni sui cicli stagionali
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <Star className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Livello di Rarità</h3>
                  <p className="text-sm text-muted-foreground">
                    Da comune a molto raro
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Native Plants Panel */}
            <NativePlantsPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LibraryTabWithLocation;