import React, { useState, useMemo } from 'react';
import type { Player, Match, PlayerMatchStatus } from '../types.ts';
import { PlayerRole, AttendanceStatus, PaymentStatus } from '../types.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface MatchAdminModalProps {
    match: Match;
    players: Player[];
    onClose: () => void;
    onSave: (updatedStatuses: PlayerMatchStatus[]) => Promise<void>;
}

// Normalize text for flexible search (Ruzo -> Ruso)
const normalizeText = (text: string) => {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/z/g, 's')
        .replace(/c/g, 's');
};

export const MatchAdminModal: React.FC<MatchAdminModalProps> = ({ match, players, onClose, onSave }) => {
    const { t } = useLanguage();
    const [localStatuses, setLocalStatuses] = useState<PlayerMatchStatus[]>(JSON.parse(JSON.stringify(match.playerStatuses)));
    const [activeTab, setActiveTab] = useState<'attendance' | 'stats'>('attendance');
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const sortedPlayers = useMemo(() => {
        const term = normalizeText(searchTerm);
        return [...players]
            .filter(p => 
                normalizeText(p.firstName).includes(term) || 
                normalizeText(p.lastName).includes(term) || 
                normalizeText(p.nickname).includes(term)
            )
            .sort((a, b) => a.lastName.localeCompare(b.lastName));
    }, [players, searchTerm]);

    const getStatus = (playerId: number): PlayerMatchStatus => {
        return localStatuses.find(s => s.playerId === playerId) || {
            playerId,
            attendanceStatus: AttendanceStatus.PENDING,
            paymentStatus: PaymentStatus.UNPAID,
            amountPaid: 0,
            quartersPlayed: 4 // Default
        } as PlayerMatchStatus;
    };

    const updateStatus = (playerId: number, updates: Partial<PlayerMatchStatus>) => {
        setLocalStatuses(prev => {
            const exists = prev.find(s => s.playerId === playerId);
            
            // Auto-calculate payment status if amount changes
            if (updates.amountPaid !== undefined) {
                const confirmedCount = prev.filter(s => s.attendanceStatus === AttendanceStatus.CONFIRMED).length || 1;
                const playerShare = match.courtFee / confirmedCount;
                const threshold = playerShare * 0.95;
                
                if (updates.amountPaid >= threshold) {
                    updates.paymentStatus = PaymentStatus.PAID;
                } else if (updates.amountPaid > 0) {
                    updates.paymentStatus = PaymentStatus.PARTIAL;
                } else {
                    updates.paymentStatus = PaymentStatus.UNPAID;
                }
            }

            if (exists) {
                return prev.map(s => s.playerId === playerId ? { ...s, ...updates } : s);
            } else {
                return [...prev, {
                    playerId,
                    attendanceStatus: AttendanceStatus.PENDING,
                    paymentStatus: PaymentStatus.UNPAID,
                    amountPaid: 0,
                    quartersPlayed: 4,
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
            'CONFIRMED': { active: 'bg-green-500 text-white shadow-lg scale-110', inactive: 'bg-gray-100 text-gray-400 hover:bg-gray-200' },
            'DOUBTFUL': { active: 'bg-yellow-500 text-white shadow-lg scale-110', inactive: 'bg-gray-100 text-gray-400 hover:bg-gray-200' },
            'ABSENT': { active: 'bg-red-500 text-white shadow-lg scale-110', inactive: 'bg-gray-100 text-gray-400 hover:bg-gray-200' },
        };
        const isActive = current === type;
        // @ts-ignore
        const style = styles[type];

        return (
            <button
                type="button"
                onClick={onClick}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-200 ${isActive ? style.active : style.inactive}`}
                title={label}
            >
                {type === 'CONFIRMED' ? '✓' : type === 'DOUBTFUL' ? '?' : '✕'}
            </button>
        );
    };

    const BigStatCounter = ({ value, onChange, max, colorClass = "text-gray-700 dark:text-gray-200" }: { value: number, onChange: (val: number) => void, max?: number, colorClass?: string }) => (
        <div className="flex items-center justify-center space-x-1">
            <button 
                onClick={() => onChange(Math.max(0, value - 1))} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-bold transition-colors"
                tabIndex={-1}
            >
                -
            </button>
            <span className={`w-8 text-center text-lg font-bold ${colorClass}`}>{value || 0}</span>
            <button 
                onClick={() => onChange(max ? Math.min(max, value + 1) : value + 1)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-bold transition-colors"
                tabIndex={-1}
            >
                +
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[70] p-2 md:p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center bg-gray-50 dark:bg-gray-900 gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🛠️</span>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t.adminMatch}</h2>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-gray-400">🔍</span>
                            <input 
                                type="text" 
                                placeholder="Buscar..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                            <button onClick={() => setActiveTab('attendance')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'attendance' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Asistencia</button>
                            <button onClick={() => setActiveTab('stats')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'stats' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Datos y Goles</button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative flex flex-col">
                    {activeTab === 'attendance' && (
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
                            {sortedPlayers.map(player => {
                                const status = getStatus(player.id);
                                return (
                                    <div key={player.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4">
                                            <img src={player.photoUrl} className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 dark:border-gray-600" alt="" />
                                            <div>
                                                <span className="font-bold text-gray-800 dark:text-gray-100 block text-lg">{player.nickname}</span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{player.firstName} {player.lastName}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <StatusButton type="CONFIRMED" current={status.attendanceStatus} onClick={() => updateStatus(player.id, { attendanceStatus: AttendanceStatus.CONFIRMED })} label="Confirmado" />
                                            <StatusButton type="DOUBTFUL" current={status.attendanceStatus} onClick={() => updateStatus(player.id, { attendanceStatus: AttendanceStatus.DOUBTFUL })} label="Duda" />
                                            <StatusButton type="ABSENT" current={status.attendanceStatus} onClick={() => updateStatus(player.id, { attendanceStatus: AttendanceStatus.ABSENT })} label="Ausente" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'stats' && (
                        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900/50 relative">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 sticky top-0 z-30 shadow-sm">
                                    <tr>
                                        {/* Sticky Column Header */}
                                        <th className="sticky left-0 z-40 bg-gray-100 dark:bg-gray-800 px-4 py-3 min-w-[180px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r dark:border-gray-700">
                                            Jugador
                                        </th>
                                        <th className="px-4 py-3 min-w-[120px] text-center border-r dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                                            Pago
                                        </th>
                                        <th className="px-4 py-3 min-w-[140px] text-center border-r dark:border-gray-700 text-blue-600 dark:text-blue-400">
                                            ⏱️ Cuartos
                                        </th>
                                        
                                        {/* Goles Group */}
                                        <th className="px-4 py-3 min-w-[130px] text-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10">
                                            ⚽ Jugada
                                        </th>
                                        <th className="px-4 py-3 min-w-[130px] text-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10">
                                            🧠 Cabeza
                                        </th>
                                        <th className="px-4 py-3 min-w-[130px] text-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10">
                                            🎯 Penal
                                        </th>
                                        <th className="px-4 py-3 min-w-[130px] text-center text-green-600 dark:text-green-400 border-r dark:border-gray-700 bg-green-50 dark:bg-green-900/10">
                                            👟 T. Libre
                                        </th>

                                        {/* Negative Stats */}
                                        <th className="px-4 py-3 min-w-[130px] text-center text-red-500 bg-red-50 dark:bg-red-900/10">
                                            🥅 G. Contra
                                        </th>
                                        <th className="px-4 py-3 min-w-[130px] text-center text-red-500 bg-red-50 dark:bg-red-900/10">
                                            ❌ P. Errado
                                        </th>
                                        <th className="px-4 py-3 min-w-[130px] text-center text-red-500 bg-red-50 dark:bg-red-900/10">
                                            🙌 Mal Lat.
                                        </th>
                                        <th className="px-4 py-3 min-w-[130px] text-center text-red-500 bg-red-50 dark:bg-red-900/10">
                                            ☁️ Mal TL
                                        </th>
                                        <th className="px-4 py-3 min-w-[130px] text-center text-red-500 border-r dark:border-gray-700 bg-red-50 dark:bg-red-900/10">
                                            🤦 Blooper
                                        </th>

                                        <th className="px-4 py-3 min-w-[160px] text-center text-yellow-600 dark:text-yellow-500">
                                            🟨 🟥 Tarjetas
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {sortedPlayers
                                        .filter(p => getStatus(p.id).attendanceStatus === AttendanceStatus.CONFIRMED && p.role !== PlayerRole.DT && p.role !== PlayerRole.AYUDANTE)
                                        .map(player => {
                                            const s = getStatus(player.id);
                                            return (
                                                <tr key={player.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                                                    
                                                    {/* Sticky Name Column */}
                                                    <td className="sticky left-0 z-20 bg-white dark:bg-gray-800 px-4 py-3 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r dark:border-gray-700 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/30 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative">
                                                                <img src={player.photoUrl} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600" alt="" />
                                                                {player.jerseyNumber && <span className="absolute -bottom-1 -right-1 bg-gray-700 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border border-white">{player.jerseyNumber}</span>}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap">{player.nickname}</span>
                                                                <span className="text-[10px] text-gray-500 uppercase">{player.role.split(' ')[0]}</span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Payment */}
                                                    <td className="px-4 py-3 text-center border-r dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                                            <input 
                                                                type="number" 
                                                                value={s.amountPaid || ''} 
                                                                onChange={(e) => updateStatus(player.id, { amountPaid: parseFloat(e.target.value) })}
                                                                className={`w-24 text-right pr-2 py-1 rounded border-2 outline-none font-bold text-sm transition-colors ${s.paymentStatus === PaymentStatus.PAID ? 'border-green-500 text-green-700 bg-green-50' : s.paymentStatus === PaymentStatus.PARTIAL ? 'border-yellow-400 text-yellow-700 bg-yellow-50' : 'border-red-300 text-red-700 bg-white'}`}
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </td>

                                                    {/* Quarters */}
                                                    <td className="px-4 py-3 text-center border-r dark:border-gray-700">
                                                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-1 inline-block border border-blue-100 dark:border-blue-800">
                                                            <BigStatCounter value={s.quartersPlayed ?? 4} onChange={(v) => updateStatus(player.id, { quartersPlayed: v })} max={4} colorClass="text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                    </td>

                                                    {/* Goals: Jugada */}
                                                    <td className="px-4 py-3 text-center bg-green-50/30 dark:bg-green-900/5">
                                                        <BigStatCounter value={s.goalsPlay || 0} onChange={(v) => updateStatus(player.id, { goalsPlay: v })} colorClass="text-green-700 dark:text-green-400" />
                                                    </td>
                                                    
                                                    {/* Goals: Cabeza */}
                                                    <td className="px-4 py-3 text-center bg-green-50/30 dark:bg-green-900/5">
                                                        <BigStatCounter value={s.goalsHeader || 0} onChange={(v) => updateStatus(player.id, { goalsHeader: v })} colorClass="text-green-700 dark:text-green-400" />
                                                    </td>

                                                    {/* Goals: Penal */}
                                                    <td className="px-4 py-3 text-center bg-green-50/30 dark:bg-green-900/5">
                                                        <BigStatCounter value={s.goalsPenalty || 0} onChange={(v) => updateStatus(player.id, { goalsPenalty: v })} colorClass="text-green-700 dark:text-green-400" />
                                                    </td>

                                                    {/* Goals: Tiro Libre */}
                                                    <td className="px-4 py-3 text-center border-r dark:border-gray-700 bg-green-50/30 dark:bg-green-900/5">
                                                        <BigStatCounter value={s.goalsSetPiece || 0} onChange={(v) => updateStatus(player.id, { goalsSetPiece: v })} colorClass="text-green-700 dark:text-green-400" />
                                                    </td>

                                                    {/* Gol en Contra */}
                                                    <td className="px-4 py-3 text-center bg-red-50/30 dark:bg-red-900/5">
                                                        <BigStatCounter value={s.ownGoals || 0} onChange={(v) => updateStatus(player.id, { ownGoals: v })} colorClass="text-red-500" />
                                                    </td>

                                                    {/* Penal Errado */}
                                                    <td className="px-4 py-3 text-center bg-red-50/30 dark:bg-red-900/5">
                                                        <BigStatCounter value={s.penaltiesMissed || 0} onChange={(v) => updateStatus(player.id, { penaltiesMissed: v })} colorClass="text-red-500" />
                                                    </td>

                                                    {/* Mal Lateral */}
                                                    <td className="px-4 py-3 text-center bg-red-50/30 dark:bg-red-900/5">
                                                        <BigStatCounter value={s.badThrowIns || 0} onChange={(v) => updateStatus(player.id, { badThrowIns: v })} colorClass="text-red-500" />
                                                    </td>

                                                    {/* Mal Tiro Libre */}
                                                    <td className="px-4 py-3 text-center bg-red-50/30 dark:bg-red-900/5">
                                                        <BigStatCounter value={s.badFreeKicks || 0} onChange={(v) => updateStatus(player.id, { badFreeKicks: v })} colorClass="text-red-500" />
                                                    </td>

                                                    {/* Blooper / Error */}
                                                    <td className="px-4 py-3 text-center border-r dark:border-gray-700 bg-red-50/30 dark:bg-red-900/5">
                                                        <BigStatCounter value={s.majorErrors || 0} onChange={(v) => updateStatus(player.id, { majorErrors: v })} colorClass="text-red-500" />
                                                    </td>

                                                    {/* Cards */}
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="flex items-center justify-center gap-4">
                                                            <div className="flex flex-col items-center">
                                                                <BigStatCounter value={s.yellowCards || 0} onChange={(v) => updateStatus(player.id, { yellowCards: v })} max={2} colorClass="text-yellow-600" />
                                                            </div>
                                                            <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                                            <button 
                                                                onClick={() => updateStatus(player.id, { redCard: !s.redCard })}
                                                                className={`w-8 h-10 rounded border-2 transition-all shadow-sm ${s.redCard ? 'bg-red-600 border-red-800 scale-110 shadow-red-500/50' : 'bg-white border-red-200 hover:bg-red-50'}`}
                                                                title="Tarjeta Roja"
                                                            >
                                                                {s.redCard && <span className="text-white font-bold text-xs">R</span>}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-b-xl flex justify-between items-center z-50 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                        {activeTab === 'stats' ? '💡 Desliza horizontalmente para ver más datos.' : ''}
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto justify-end">
                        <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                            Cancelar
                        </button>
                        <button onClick={handleSave} disabled={isSaving} className="px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-500/30 disabled:opacity-50 transition-all transform active:scale-95 flex items-center gap-2">
                            {isSaving ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Cambios'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};