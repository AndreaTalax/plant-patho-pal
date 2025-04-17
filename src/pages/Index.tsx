
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
    <div className="bg-background min-h-screen pb-safe pt-safe">
      <Header />
      <div className="pt-16 pb-16 min-h-screen">
        {activeTab === 'diagnose' && <DiagnoseTab />}
        {activeTab === 'chat' && <ChatTab />}
        {activeTab === 'shop' && <ShopTab />}
        {activeTab === 'library' && <LibraryTab />}
      </div>
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default Index;
