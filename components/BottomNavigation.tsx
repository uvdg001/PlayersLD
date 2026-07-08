import React from 'react';
import { V2Tab } from '../App';

interface BottomNavigationProps {
    activeTab: V2Tab;
    onTabChange: (tab: V2Tab) => void;
    isAdmin: boolean;
    hasUnreadMessages?: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabChange, isAdmin, hasUnreadMessages }) => {
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
            {isAdmin && (
                <NavIcon 
                    label="ADMIN" 
                    icon="⚙️" 
                    active={activeTab === 'ADMIN'} 
                    onClick={() => onTabChange('ADMIN')} 
                />
            )}
            <NavIcon 
                label="COMUNIDAD" 
                icon="💬" 
                active={activeTab === 'SOCIAL'} 
                onClick={() => onTabChange('SOCIAL')} 
                hasBadge={hasUnreadMessages}
            />
        </nav>
    );
};

const NavIcon: React.FC<{ label: string, icon: string, active: boolean, onClick: () => void, hasBadge?: boolean }> = ({ label, icon, active, onClick, hasBadge }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-1 transition-all relative ${active ? 'scale-110' : 'opacity-40 grayscale'}`}
    >
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : 'bg-transparent'}`}>
            {icon}
            {hasBadge && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white dark:border-gray-800 rounded-full animate-bounce-in shadow-lg flex items-center justify-center overflow-hidden">
                    <span className="absolute inset-0 bg-gradient-to-tr from-red-600 via-pink-500 to-orange-400 animate-hue-rotate"></span>
                    <span className="relative text-[8px] font-black text-white">!</span>
                </span>
            )}
        </div>
        <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>
            {label}
        </span>
    </button>
);