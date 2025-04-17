
import { useState } from 'react';
import Header from '@/components/Header';
import DiagnoseTab from '@/components/DiagnoseTab';
import ChatTab from '@/components/ChatTab';
import ShopTab from '@/components/ShopTab';
import LibraryTab from '@/components/LibraryTab';
import BottomNavigation from '@/components/BottomNavigation';

type TabName = 'diagnose' | 'chat' | 'shop' | 'library';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabName>('diagnose');

  return (
    <div className="bg-gradient-to-b from-sky-50 to-white min-h-screen pb-safe">
      <Header />
      
      {/* Hero Section */}
      <div className="relative pt-24 pb-20 md:pt-32 md:pb-28 px-4 overflow-hidden">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-drplant-blue mb-6">
              Smart Plant Disease Diagnosis
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              Get instant plant health analysis and expert consultation with our advanced AI-powered diagnosis system.
            </p>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute top-1/2 -left-24 w-48 h-48 bg-drplant-blue/10 rounded-full blur-3xl"/>
        <div className="absolute top-1/4 -right-24 w-64 h-64 bg-drplant-green/10 rounded-full blur-3xl"/>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="relative bg-white rounded-2xl shadow-lg p-4 min-h-[60vh]">
          {activeTab === 'diagnose' && <DiagnoseTab />}
          {activeTab === 'chat' && <ChatTab />}
          {activeTab === 'shop' && <ShopTab />}
          {activeTab === 'library' && <LibraryTab />}
        </div>
      </div>

      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default Index;
