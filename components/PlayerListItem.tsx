import React, { useState, useMemo } from 'react';
import type { Player, PlayerMatchStatus } from '../types.ts';
import { AttendanceStatus, PaymentStatus } from '../types.ts';
import { StarRating } from './StarRating.tsx';
import { RoleIcon } from './icons.tsx';

interface PlayerListItemProps {
    player: Player;
    playerStatus: PlayerMatchStatus;
    onPlayerStatusChange: (playerId: number, newStatus: AttendanceStatus) => void;
    onPlayerPaymentChange: (playerId: number, newStatus: PaymentStatus, amount: number) => void;
    onPlayerStatsChange: (playerId: number, field: keyof PlayerMatchStatus, value: any) => void;
    playerShare: number;
    isAdmin: boolean;
}

const EditableAmount: React.FC<{ value: number, onSave: (newValue: number) => void, isAdmin: boolean }> = ({ value, onSave, isAdmin }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value.toString());
    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

    const handleSave = () => {
        const numericValue = parseFloat(currentValue);
        if (!isNaN(numericValue)) {
            onSave(numericValue);
        } else {
            setCurrentValue(value.toString());
        }
        setIsEditing(false);
    };

    if (isEditing && isAdmin) {
        return (
            <input
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="w-20 text-sm font-bold text-green-600 bg-white dark:bg-gray-800 dark:text-green-400 rounded-md border-gray-300"
                autoFocus
            />
        );
    }

    return (
        <span
            className={`font-bold text-green-600 dark:text-green-400 ${isAdmin ? 'cursor-pointer' : ''}`}
            onClick={() => isAdmin && setIsEditing(true)}
        >
            {formatter.format(value)}
        </span>
    );
};

const StatControl: React.FC<{ icon: string; value: number; onUpdate: (newValue: number) => void; max?: number, title: string, colorClass?: string }> = ({ icon, value, onUpdate, max, title, colorClass }) => (
    <div className={`flex items-center space-x-1 p-1 rounded-md ${colorClass || 'bg-gray-200 dark:bg-gray-600'}`} title={title}>
        <span className="text-lg">{icon}</span>
        <button onClick={() => onUpdate(value - 1)} disabled={value <= 0} className="px-1 disabled:opacity-50 font-bold hover:bg-black/10 rounded">-</button>
        <span className="w-5 text-center font-bold text-sm">{value}</span>
        <button onClick={() => onUpdate(value + 1)} disabled={max !== undefined && value >= max} className="px-1 disabled:opacity-50 font-bold hover:bg-black/10 rounded">+</button>
    </div>
);


const StatusButton: React.FC<{
    label: string;
    status: AttendanceStatus;
    currentStatus: AttendanceStatus;
    onClick: () => void;
    activeClasses: string;
    inactiveClasses: string;
    icon: string;
}> = ({ label, status, currentStatus, onClick, activeClasses, inactiveClasses, icon }) => (
    <button onClick={onClick} className={`w-10 h-10 flex items-center justify-center rounded-full text-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${currentStatus === status ? activeClasses : inactiveClasses}`} aria-label={label}>
        {icon}
    </button>
);

const PaymentStatusIcon: React.FC<{ status: PaymentStatus }> = ({ status }) => {
    const baseClasses = "w-4 h-4 rounded-full shadow-inner border border-white dark:border-gray-600";
    switch (status) {
        case PaymentStatus.PAID:
            return <div title="Pagado" className={`${baseClasses} bg-green-500`}></div>;
        case PaymentStatus.PARTIAL:
            return <div title="Pago Parcial" className={`${baseClasses} bg-yellow-500`}></div>;
        case PaymentStatus.UNPAID:
        default:
            return <div title="No Pagó" className={`${baseClasses} bg-red-500`}></div>;
    }
};


export const PlayerListItem: React.FC<PlayerListItemProps> = ({ player, playerStatus, onPlayerStatusChange, onPlayerPaymentChange, onPlayerStatsChange, playerShare, isAdmin }) => {
    
    const handleSavePayment = (newTotal: number) => {
        let newStatus: PaymentStatus;

        if (newTotal <= 0) {
            newStatus = PaymentStatus.UNPAID;
        } else if (playerShare > 0 && newTotal >= playerShare * 0.95) { 
            newStatus = PaymentStatus.PAID;
        } else {
            newStatus = PaymentStatus.PARTIAL;
        }
        onPlayerPaymentChange(player.id, newStatus, newTotal);
    };
    
    const handleStatChange = (field: keyof PlayerMatchStatus, value: number) => {
        if (value < 0) value = 0;
        onPlayerStatsChange(player.id, field, value);
    };
    
    const handleRedCardToggle = () => {
        onPlayerStatsChange(player.id, 'redCard', !playerStatus.redCard);
    };

    const totalGoals = useMemo(() => {
        return (playerStatus.goalsPlay || 0) + 
               (playerStatus.goalsPenalty || 0) + 
               (playerStatus.goalsHeader || 0) + 
               (playerStatus.goalsSetPiece || 0);
    }, [playerStatus]);

    const statusStyles: Record<AttendanceStatus, string> = {
        [AttendanceStatus.CONFIRMED]: 'border-l-4 border-green-500',
        [AttendanceStatus.DOUBTFUL]: 'border-l-4 border-yellow-500',
        [AttendanceStatus.ABSENT]: 'border-l-4 border-red-500',
        [AttendanceStatus.PENDING]: 'border-l-4 border-gray-400 dark:border-gray-600',
    };

    return (
        <div className={`p-3 bg-gray-100 dark:bg-gray-700 rounded-lg ${statusStyles[playerStatus.attendanceStatus]}`}>
            <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                     {player.photoUrl ? (
                        <img src={player.photoUrl} alt={player.nickname} className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 dark:border-gray-500" />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-400">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                        </div>
                    )}
                     <div>
                        <div className="flex items-center space-x-2">
                           <div title={player.role}>
                                <RoleIcon role={player.role} className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                           </div>
                           <p className="font-bold text-lg text-gray-800 dark:text-gray-200">{`${player.firstName} "${player.nickname}" ${player.lastName}`}</p>
                           {totalGoals > 0 && <span className="font-bold text-green-600 text-lg ml-2">⚽ {totalGoals}</span>}
                           {(playerStatus.assists || 0) > 0 && <span className="font-bold text-blue-500 text-sm ml-1">👟 {playerStatus.assists}</span>}
                        </div>
                        <StarRating rating={player.skillLevel} />
                        <div className="flex items-center space-x-2 mt-1">
                           <PaymentStatusIcon status={playerStatus.paymentStatus} />
                           <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Pagado:</span>
                           <EditableAmount value={playerStatus.amountPaid} onSave={handleSavePayment} isAdmin={isAdmin} />
                        </div>
                     </div>
                </div>
                 <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <StatusButton label="Confirmar" icon="✅" status={AttendanceStatus.CONFIRMED} currentStatus={playerStatus.attendanceStatus} onClick={() => onPlayerStatusChange(player.id, AttendanceStatus.CONFIRMED)} activeClasses="bg-green-500 scale-110 shadow-lg ring-green-400" inactiveClasses="bg-gray-300 dark:bg-gray-600 hover:bg-green-300" />
                    <StatusButton label="En Duda" icon="❓" status={AttendanceStatus.DOUBTFUL} currentStatus={playerStatus.attendanceStatus} onClick={() => onPlayerStatusChange(player.id, AttendanceStatus.DOUBTFUL)} activeClasses="bg-yellow-500 scale-110 shadow-lg ring-yellow-400" inactiveClasses="bg-gray-300 dark:bg-gray-600 hover:bg-yellow-300" />
                    <StatusButton label="Ausente" icon="❌" status={AttendanceStatus.ABSENT} currentStatus={playerStatus.attendanceStatus} onClick={() => onPlayerStatusChange(player.id, AttendanceStatus.ABSENT)} activeClasses="bg-red-500 scale-110 shadow-lg ring-red-400" inactiveClasses="bg-gray-300 dark:bg-gray-600 hover:bg-red-300" />
                </div>
            </div>
            
            {/* ADMIN STATS CONTROLS */}
            {isAdmin && playerStatus.attendanceStatus === AttendanceStatus.CONFIRMED && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        {/* Goles */}
                        <StatControl title="Gol de Jugada" icon="⚽" value={playerStatus.goalsPlay || 0} onUpdate={(v) => handleStatChange('goalsPlay', v)} />
                        <StatControl title="Gol de Cabeza" icon="🧠" value={playerStatus.goalsHeader || 0} onUpdate={(v) => handleStatChange('goalsHeader', v)} />
                        <StatControl title="Gol de Penal" icon="🎯" value={playerStatus.goalsPenalty || 0} onUpdate={(v) => handleStatChange('goalsPenalty', v)} />
                        <StatControl title="Gol de Tiro Libre" icon="👟" value={playerStatus.goalsSetPiece || 0} onUpdate={(v) => handleStatChange('goalsSetPiece', v)} />
                        
                        {/* Asistencias */}
                        <div className="w-px h-6 bg-gray-300 dark:bg-gray-500 mx-1"></div>
                        <StatControl title="Asistencia (Pase Gol)" icon="🅰️" value={playerStatus.assists || 0} onUpdate={(v) => handleStatChange('assists', v)} colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200" />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Tarjetas */}
                        <StatControl title="Tarjetas Amarillas" icon="🟨" value={playerStatus.yellowCards || 0} onUpdate={(v) => handleStatChange('yellowCards', v)} max={2} colorClass="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800" />
                        
                        <button 
                            onClick={handleRedCardToggle} 
                            className={`flex items-center space-x-1 px-2 py-1 rounded-md border ${playerStatus.redCard ? 'bg-red-100 border-red-500 text-red-700' : 'bg-gray-100 border-gray-300 text-gray-400'}`} 
                            title="Tarjeta Roja"
                        >
                            <span className="text-lg">🟥</span>
                            <span className="font-bold text-sm">{playerStatus.redCard ? '1' : '0'}</span>
                        </button>

                        <div className="w-px h-6 bg-gray-300 dark:bg-gray-500 mx-1"></div>
                        
                        {/* Cuartos */}
                        <StatControl title="Cuartos Jugados" icon="⏱️" value={playerStatus.quartersPlayed ?? 4} onUpdate={(v) => handleStatChange('quartersPlayed', v)} max={4} />
                    </div>
                </div>
            )}
        </div>
    );
};