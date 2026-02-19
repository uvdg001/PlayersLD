
import React from 'react';
import { V2Tab } from '../../App_V2';

interface BottomNavigationProps {
    activeTab: V2Tab;
    onTabChange: (tab: V2Tab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 h-20 px-6 flex items-center justify-around z-50 shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
            <NavIcon 
                label="EL PARTIDO" 
                icon="⚽" 
                active={activeTab === 'HOME'} 
                onClick={() => onTabChange('HOME')} 
            />
            <NavIcon 
                label="MUNDO PLAYERS" 
                icon="🛡️" 
                active={activeTab === 'CLUB'} 
                onClick={() => onTabChange('CLUB')} 
            />
            <NavIcon 
                label="COMUNIDAD" 
                icon="💬" 
                active={activeTab === 'SOCIAL'} 
                onClick={() => onTabChange('SOCIAL')} 
            />
        </nav>
    );
};

const NavIcon: React.FC<{ label: string, icon: string, active: boolean, onClick: () => void }> = ({ label, icon, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-1 transition-all ${active ? 'scale-110' : 'opacity-40 grayscale'}`}
    >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : 'bg-transparent'}`}>
            {icon}
        </div>
        <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>
            {label}
        </span>
    </button>
);
