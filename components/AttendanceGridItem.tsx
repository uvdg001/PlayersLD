
import React from 'react';
import type { Player, MatchStatus } from '../types.ts';
import { AttendanceStatus } from '../types.ts';

interface AttendanceGridItemProps {
    player: Player;
    status: AttendanceStatus;
    onStatusChange: (newStatus: AttendanceStatus) => void;
    currentUser: Player;
    isAdmin: boolean;
    matchStatus?: MatchStatus;
}

const StatusButton: React.FC<{
    icon: string;
    label: string;
    isSelected: boolean;
    onClick: () => void;
    disabled: boolean;
}> = ({ icon, label, isSelected, onClick, disabled }) => {
    
    // Base classes
    let classes = `w-10 h-10 flex items-center justify-center rounded-full text-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 `;

    // Selected state classes
    if (isSelected) {
        classes += 'ring-2 ring-black dark:ring-white ';
    } else {
        classes += 'bg-gray-200 dark:bg-gray-600 opacity-60 ';
    }
    
    // Disabled state classes
    if (disabled) {
        classes += 'cursor-not-allowed ';
    } else {
         classes += 'hover:opacity-100 ';
    }

    return (
        <button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            disabled={disabled}
            className={classes}
            aria-label={label}
            title={label}
        >
            {icon === '✅' ? 
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isSelected ? 'bg-green-500' : 'bg-transparent border border-green-500'}`}>
                    <span className={`${isSelected ? 'text-white' : 'text-green-600'}`}>✓</span>
                </div> : 
             icon === '❓' ?
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isSelected ? 'bg-yellow-500' : 'bg-transparent border border-yellow-500'}`}>
                    <span className={`${isSelected ? 'text-white' : 'text-yellow-600'}`}>?</span>
                </div> :
             icon === '❌' ?
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isSelected ? 'bg-red-500' : 'bg-transparent border border-red-500'}`}>
                    <span className={`${isSelected ? 'text-white' : 'text-red-600'}`}>×</span>
                </div> :
             icon
            }
        </button>
    );
}

export const AttendanceGridItem: React.FC<AttendanceGridItemProps> = ({ player, status, onStatusChange, currentUser, isAdmin, matchStatus }) => {
    // Es interactivo si:
    // 1. Es admin (siempre puede editar)
    // 2. O: Es el usuario dueño del perfil Y el partido NO está finalizado
    const isInteractive = isAdmin || (currentUser.id === player.id && matchStatus !== 'FINALIZADO');

    const statusStyles: Record<AttendanceStatus, { bg: string; border: string; }> = {
        [AttendanceStatus.CONFIRMED]: { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-500' },
        [AttendanceStatus.DOUBTFUL]: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', border: 'border-yellow-500' },
        [AttendanceStatus.ABSENT]: { bg: 'bg-red-100 dark:bg-red-900/40', border: 'border-red-500' },
        [AttendanceStatus.PENDING]: { bg: 'bg-gray-100 dark:bg-gray-700/50', border: 'border-gray-400' },
    };
    
    const selectedStyle = statusStyles[status];

    return (
        <div className={`p-3 rounded-2xl shadow-md border-2 ${selectedStyle.bg} ${selectedStyle.border}`}>
            <div className="flex flex-col items-center gap-2">
                 <div className="relative">
                    {player.photoUrl ? (
                        <img src={player.photoUrl} alt={player.nickname} className={`w-20 h-20 rounded-full object-cover border-4 ${selectedStyle.border}`} />
                    ) : (
                        <div className={`w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400 border-4 ${selectedStyle.border}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                        </div>
                    )}
                     {player.jerseyNumber && (
                        <div className="absolute -bottom-1 -right-1 bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white dark:border-gray-800">
                            {player.jerseyNumber}
                        </div>
                    )}
                </div>
                <p className="font-bold text-gray-800 dark:text-gray-200 text-lg">{player.nickname}</p>

                 <div className="flex justify-center space-x-3 mt-1">
                    <StatusButton
                        icon="✅"
                        label="Confirmar"
                        isSelected={status === AttendanceStatus.CONFIRMED}
                        onClick={() => onStatusChange(AttendanceStatus.CONFIRMED)}
                        disabled={!isInteractive}
                    />
                    <StatusButton
                        icon="❓"
                        label="En Duda"
                        isSelected={status === AttendanceStatus.DOUBTFUL}
                        onClick={() => onStatusChange(AttendanceStatus.DOUBTFUL)}
                        disabled={!isInteractive}
                    />
                    <StatusButton
                        icon="❌"
                        label="Ausente"
                        isSelected={status === AttendanceStatus.ABSENT}
                        onClick={() => onStatusChange(AttendanceStatus.ABSENT)}
                        disabled={!isInteractive}
                    />
                </div>
            </div>
        </div>
    );
};
