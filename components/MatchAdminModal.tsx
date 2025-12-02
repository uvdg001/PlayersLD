
import React, { useState, useMemo } from 'react';
import type { Player, Match, PlayerMatchStatus } from '../types.ts';
import { PlayerRole, AttendanceStatus, PaymentStatus } from '../types.ts';

interface MatchAdminModalProps {
    match: Match;
    players: Player[];
    onClose: () => void;
    onSave: (updatedStatuses: PlayerMatchStatus[]) => Promise<void>;
}

export const MatchAdminModal: React.FC<MatchAdminModalProps> = ({ match, players, onClose, onSave }) => {
    // Estado local para manejar los cambios antes de guardar
    const [localStatuses, setLocalStatuses] = useState<PlayerMatchStatus[]>(JSON.parse(JSON.stringify(match.playerStatuses)));
    const [activeTab, setActiveTab] = useState<'attendance' | 'stats'>('attendance');
    const [isSaving, setIsSaving] = useState(false);

    // Ordenar jugadores alfabéticamente por Apellido para estabilidad visual
    const sortedPlayers = useMemo(() => {
        return [...players].sort((a, b) => a.lastName.localeCompare(b.lastName));
    }, [players]);

    const getStatus = (playerId: number): PlayerMatchStatus => {
        return localStatuses.find(s => s.playerId === playerId) || {
            playerId,
            attendanceStatus: AttendanceStatus.PENDING,
            paymentStatus: PaymentStatus.UNPAID,
            amountPaid: 0
        } as PlayerMatchStatus;
    };

    const updateStatus = (playerId: number, updates: Partial<PlayerMatchStatus>) => {
        setLocalStatuses(prev => {
            const exists = prev.find(s => s.playerId === playerId);
            if (exists) {
                return prev.map(s => s.playerId === playerId ? { ...s, ...updates } : s);
            } else {
                return [...prev, {
                    playerId,
                    attendanceStatus: AttendanceStatus.PENDING,
                    paymentStatus: PaymentStatus.UNPAID,
                    amountPaid: 0,
                    ...updates
                } as PlayerMatchStatus];
            }
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(localStatuses);
        setIsSaving(false);
        onClose();
    };

    const StatusButton = ({ type, current, onClick, label }: any) => {
        const styles = {
            'CONFIRMED': { active: 'bg-green-500 text-white', inactive: 'bg-gray-200 text-gray-400' },
            'DOUBTFUL': { active: 'bg-yellow-500 text-white', inactive: 'bg-gray-200 text-gray-400' },
            'ABSENT': { active: 'bg-red-500 text-white', inactive: 'bg-gray-200 text-gray-400' },
        };
        const isActive = current === type;
        // @ts-ignore
        const style = styles[type];

        return (
            <button
                type="button"
                onClick={onClick}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${isActive ? style.active : style.inactive}`}
                title={label}
            >
                {type === 'CONFIRMED' ? '✓' : type === 'DOUBTFUL' ? '?' : '✕'}
            </button>
        );
    };

    const StatCounter = ({ value, onChange, max }: { value: number, onChange: (val: number) => void, max?: number }) => (
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded px-1">
            <button 
                onClick={() => onChange(Math.max(0, value - 1))}
                className="w-6 h-6 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
                -
            </button>
            <span className="w-4 text-center text-sm font-bold">{value || 0}</span>
            <button 
                onClick={() => onChange(max ? Math.min(max, value + 1) : value + 1)}
                className="w-6 h-6 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
                +
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[70] p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 rounded-t-xl">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Administrar Partido (Lote)</h2>
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => setActiveTab('attendance')}
                            className={`px-3 py-1 rounded-md text-sm font-medium ${activeTab === 'attendance' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
                        >
                            Asistencia
                        </button>
                        <button 
                            onClick={() => setActiveTab('stats')}
                            className={`px-3 py-1 rounded-md text-sm font-medium ${activeTab === 'stats' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}
                        >
                            Estadísticas
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {activeTab === 'attendance' && (
                        <div className="space-y-2">
                            <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-500 uppercase mb-2 px-2">
                                <div className="col-span-6">Jugador</div>
                                <div className="col-span-6 flex justify-end gap-6 pr-2">
                                    <span>Sí</span>
                                    <span>Duda</span>
                                    <span>No</span>
                                </div>
                            </div>
                            {sortedPlayers.map(player => {
                                const status = getStatus(player.id);
                                return (
                                    <div key={player.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <img src={player.photoUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                                            <span className="font-medium text-gray-700 dark:text-gray-200 text-sm md:text-base">
                                                {player.lastName}, {player.firstName}
                                            </span>
                                        </div>
                                        <div className="flex gap-4">
                                            <StatusButton 
                                                type="CONFIRMED" 
                                                current={status.attendanceStatus} 
                                                onClick={() => updateStatus(player.id, { attendanceStatus: AttendanceStatus.CONFIRMED })} 
                                            />
                                            <StatusButton 
                                                type="DOUBTFUL" 
                                                current={status.attendanceStatus} 
                                                onClick={() => updateStatus(player.id, { attendanceStatus: AttendanceStatus.DOUBTFUL })} 
                                            />
                                            <StatusButton 
                                                type="ABSENT" 
                                                current={status.attendanceStatus} 
                                                onClick={() => updateStatus(player.id, { attendanceStatus: AttendanceStatus.ABSENT })} 
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'stats' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-2 py-2">Jugador</th>
                                        <th className="px-2 py-2 text-center">Jugada</th>
                                        <th className="px-2 py-2 text-center">Penal</th>
                                        <th className="px-2 py-2 text-center">Cabeza</th>
                                        <th className="px-2 py-2 text-center">T.Libre</th>
                                        <th className="px-2 py-2 text-center">1/4s</th>
                                        <th className="px-2 py-2 text-center">Tarjetas</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {sortedPlayers
                                        .filter(p => getStatus(p.id).attendanceStatus === AttendanceStatus.CONFIRMED && p.role !== PlayerRole.DT && p.role !== PlayerRole.AYUDANTE)
                                        .map(player => {
                                            const s = getStatus(player.id);
                                            return (
                                                <tr key={player.id} className="bg-white dark:bg-gray-800">
                                                    <td className="px-2 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                                        {player.nickname}
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <StatCounter value={s.goalsPlay || 0} onChange={(v) => updateStatus(player.id, { goalsPlay: v })} />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <StatCounter value={s.goalsPenalty || 0} onChange={(v) => updateStatus(player.id, { goalsPenalty: v })} />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <StatCounter value={s.goalsHeader || 0} onChange={(v) => updateStatus(player.id, { goalsHeader: v })} />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <StatCounter value={s.goalsSetPiece || 0} onChange={(v) => updateStatus(player.id, { goalsSetPiece: v })} />
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <StatCounter value={s.quartersPlayed || 0} onChange={(v) => updateStatus(player.id, { quartersPlayed: v })} max={4} />
                                                    </td>
                                                    <td className="px-2 py-2 flex items-center justify-center gap-1">
                                                        <button 
                                                            onClick={() => updateStatus(player.id, { yellowCards: (s.yellowCards || 0) < 2 ? (s.yellowCards || 0) + 1 : 0 })}
                                                            className={`w-5 h-7 rounded border border-yellow-600 ${s.yellowCards ? 'bg-yellow-400' : 'bg-gray-100 dark:bg-gray-700'}`}
                                                        />
                                                        <button 
                                                            onClick={() => updateStatus(player.id, { redCard: !s.redCard })}
                                                            className={`w-5 h-7 rounded border border-red-800 ${s.redCard ? 'bg-red-600' : 'bg-gray-100 dark:bg-gray-700'}`}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                            {localStatuses.filter(s => s.attendanceStatus === AttendanceStatus.CONFIRMED).length === 0 && (
                                <p className="text-center p-4 text-gray-500">No hay jugadores confirmados para cargar estadísticas.</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl flex justify-end space-x-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 shadow-sm disabled:opacity-50"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Todos los Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};
