
import React, { useState } from 'react';
import type { Player, MatchStatus, PlayerMatchStatus } from '../types.ts';
import { AttendanceStatus, PlayerRole } from '../types.ts';
import { StarRating } from './StarRating.tsx';

interface AttendanceGridItemProps {
    player: Player;
    playerStatus: PlayerMatchStatus;
    onStatusChange: (newStatus: AttendanceStatus) => void;
    onPlayerStatsChange: (playerId: number, field: keyof PlayerMatchStatus, value: any) => void;
    currentUser: Player;
    isAdmin: boolean;
    matchStatus?: MatchStatus;
    onViewProfile?: (player: Player) => void;
}

const StatusButton: React.FC<{ icon: string; label: string; isSelected: boolean; onClick: () => void; disabled: boolean; }> = ({ icon, label, isSelected, onClick, disabled }) => (
    <button onClick={(e) => { e.preventDefault(); onClick(); }} disabled={disabled} className={`w-12 h-12 flex items-center justify-center rounded-full text-2xl transition-all duration-200 ${isSelected ? 'ring-2 ring-black dark:ring-white' : 'bg-gray-200 dark:bg-gray-600 opacity-60'} ${disabled ? 'cursor-not-allowed' : 'hover:opacity-100'}`} title={label}>
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${isSelected ? (label === 'Confirmar' ? 'bg-green-500' : label === 'En Duda' ? 'bg-yellow-500' : label === 'Ausente' ? 'bg-red-500' : 'bg-gray-400') : 'bg-transparent border border-gray-400'}`}>
            <span className={isSelected ? 'text-white' : ''}>{icon}</span>
        </div>
    </button>
);

const StatControl: React.FC<{ icon: string; value: number; onUpdate: (newValue: number) => void; max?: number, title: string, colorClass?: string }> = ({ icon, value, onUpdate, max, title, colorClass }) => (
    <div className={`flex items-center space-x-1 p-1 rounded-md ${colorClass || 'bg-gray-200 dark:bg-gray-600'}`} title={title}>
        <span className="text-lg">{icon}</span>
        <button onClick={() => onUpdate(value - 1)} disabled={value <= 0} className="px-1 disabled:opacity-50 font-bold hover:bg-black/10 rounded">-</button>
        <span className="w-5 text-center font-bold text-sm">{value}</span>
        <button onClick={() => onUpdate(value + 1)} disabled={max !== undefined && value >= max} className="px-1 disabled:opacity-50 font-bold hover:bg-black/10 rounded">+</button>
    </div>
);


export const AttendanceGridItem: React.FC<AttendanceGridItemProps> = ({ 
    player, playerStatus, onStatusChange, onPlayerStatsChange, 
    currentUser, isAdmin, matchStatus, onViewProfile
}) => {
    const [imgError, setImgError] = useState(false);
    const isInteractive = isAdmin || (currentUser.id === player.id && matchStatus !== 'FINALIZADO');
    const isStaff = player.role === PlayerRole.DT || player.role === PlayerRole.AYUDANTE;
    const status = playerStatus.attendanceStatus;
    
    const handleStatusClick = (clickedStatus: AttendanceStatus) => {
        if (status === clickedStatus) {
            onStatusChange(AttendanceStatus.PENDING);
        } else {
            onStatusChange(clickedStatus);
        }
    };

    const statusStyles = {
        [AttendanceStatus.CONFIRMED]: { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-500' },
        [AttendanceStatus.DOUBTFUL]: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', border: 'border-yellow-500' },
        [AttendanceStatus.ABSENT]: { bg: 'bg-red-100 dark:bg-red-900/40', border: 'border-red-500' },
        [AttendanceStatus.PENDING]: { bg: 'bg-gray-100 dark:bg-gray-700/50', border: 'border-gray-400' },
    }[status];

    const cardBorderColor = isStaff ? 'border-black dark:border-white' : statusStyles.border;
    const imageBorderColor = isStaff ? 'border-black' : statusStyles.border;

    return (
        <div className={`p-4 rounded-3xl shadow-md border-2 relative transition-all ${statusStyles.bg} ${cardBorderColor}`}>
            <div className="flex flex-col items-center gap-3">
                 <div className="relative group cursor-pointer" onClick={() => onViewProfile && onViewProfile(player)}>
                    {player.photoUrl && !imgError ? (
                        <img 
                            src={player.photoUrl} 
                            onError={() => setImgError(true)}
                            className={`w-32 h-32 rounded-full object-cover border-[6px] ${imageBorderColor} transform transition-transform duration-200 hover:scale-105 active:scale-95 shadow-xl`} 
                            alt="" 
                        />
                    ) : (
                        <div className={`w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-[6px] ${imageBorderColor} shadow-xl text-4xl`}>
                            👤
                        </div>
                    )}
                     {!isStaff && player.jerseyNumber && (
                        <div className="absolute -bottom-1 -right-1 bg-gray-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 border-white shadow-lg">
                            {player.jerseyNumber}
                        </div>
                    )}
                </div>
                <div className="text-center w-full">
                     <p className="font-black text-xl truncate text-gray-900 dark:text-gray-100 tracking-tighter">
                        {player.nickname}
                     </p>
                     
                     {isStaff ? (
                        <div className="mt-1">
                            <span className="inline-block px-3 py-0.5 text-[8px] font-black rounded-full uppercase tracking-widest shadow-sm bg-black dark:bg-white dark:text-black">
                                {player.role === PlayerRole.DT ? 'DT' : 'AYUDANTE'}
                            </span>
                        </div>
                     ) : (
                         <div className="flex justify-center mt-1">
                             <StarRating rating={player.skillLevel} size="text-[10px]" />
                         </div>
                     )}
                </div>

                 <div className="flex justify-center space-x-3 mt-2">
                    <StatusButton icon="✓" label="Confirmar" isSelected={status === AttendanceStatus.CONFIRMED} onClick={() => handleStatusClick(AttendanceStatus.CONFIRMED)} disabled={!isInteractive} />
                    <StatusButton icon="?" label="En Duda" isSelected={status === AttendanceStatus.DOUBTFUL} onClick={() => handleStatusClick(AttendanceStatus.DOUBTFUL)} disabled={!isInteractive} />
                    <StatusButton icon="✕" label="Ausente" isSelected={status === AttendanceStatus.ABSENT} onClick={() => handleStatusClick(AttendanceStatus.ABSENT)} disabled={!isInteractive} />
                </div>
            </div>

            {/* ADMIN STATS CONTROLS */}
            {isAdmin && status === AttendanceStatus.CONFIRMED && !isStaff && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex flex-wrap justify-center items-center gap-2">
                        <StatControl title="Goles" icon="⚽" value={(playerStatus.goalsPlay||0)+(playerStatus.goalsHeader||0)+(playerStatus.goalsPenalty||0)+(playerStatus.goalsSetPiece||0)} onUpdate={(v) => onPlayerStatsChange(player.id, 'goalsPlay', v)} />
                        <StatControl title="Amarillas" icon="🟨" value={playerStatus.yellowCards || 0} onUpdate={(v) => onPlayerStatsChange(player.id, 'yellowCards', v)} max={2} colorClass="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800" />
                        <button onClick={() => onPlayerStatsChange(player.id, 'redCard', !playerStatus.redCard)} className={`flex items-center space-x-1 px-3 py-1 rounded-md border-2 ${playerStatus.redCard ? 'bg-red-600 border-red-700 text-white' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                            <span className="text-sm">🟥</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
