import React from 'react';
import { Timer, CalendarDays } from 'lucide-react';

type Tab = 'timer' | 'history';

interface BottomNavBarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'timer' as const, icon: Timer },
    { id: 'history' as const, icon: CalendarDays },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 desktop-hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn-nav ${isActive ? 'active' : ''}`}
          >
            <Icon size={30} />
          </button>
        );
      })}
    </div>
  );
};

export default BottomNavBar;