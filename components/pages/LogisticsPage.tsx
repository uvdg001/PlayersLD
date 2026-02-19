
import React, { useMemo } from 'react';
import type { Player, Match } from '../../types.ts';

interface LogisticsPageProps {
    players: Player[];
    matches: Match[];
    selectedMatchId: number;
    onUpdateLogistics: (matchId: number, field: 'jerseyWasherId' | 'ballBringerId' | 'waterBringerId' | 'medicineKitBringerId', value: any) => void;
    isAdmin: boolean;
}

const ItemCard: React.FC<{
    title: string;
    icon: string;
    value: number | undefined;
    players: Player[];
    onAssign: (playerId: number) => void;
    suggestions: Player[];
    isAdmin: boolean;
    colorClass: string;
}> = ({ title, icon, value, players, onAssign, suggestions, isAdmin, colorClass }) => {
    
    const assignedPlayer = players.find(p => p.id === value);

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 border-t-4 ${colorClass} transition-transform hover:scale-[1.02]`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="text-3xl filter drop-shadow-sm">{icon}</span>
                    <h3 className="font-black text-gray-800 dark:text-gray-100 uppercase tracking-tighter">{title}</h3>
                </div>
            </div>
            
            <div className="mb-4">
                <p className="text-[10px] text-gray-400 uppercase font-black mb-2 tracking-widest">Responsable:</p>
                {assignedPlayer ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                        <img src={assignedPlayer.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm" />
                        <span className="font-bold text-gray-800 dark:text-white truncate">{assignedPlayer.nickname}</span>
                    </div>
                ) : (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-dashed border-red-200 text-center">
                        <p className="text-xs text-red-500 font-bold italic">Sin asignar</p>
                    </div>
                )}
            </div>

            {isAdmin && (
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                    <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 mb-2 uppercase">Asignar a:</label>
                    <select
                        value={value || ''}
                        onChange={(e) => onAssign(Number(e.target.value))}
                        className="w-full text-xs font-bold rounded-lg border-gray-200 dark:bg-gray-900 dark:border-gray-700 p-2 outline-none focus:border-indigo-500"
                    >
                        <option value="">Seleccionar...</option>
                        {players.sort((a, b) => a.nickname.localeCompare(b.nickname)).map(p => (
                            <option key={p.id} value={p.id}>{p.nickname}</option>
                        ))}
                    </select>
                    {suggestions.length > 0 && (
                        <div className="mt-3">
                            <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-black mb-2 uppercase tracking-widest">Sugerencia (Los que menos hicieron):</p>
                            <div className="flex flex-wrap gap-1">
                                {suggestions.slice(0, 3).map(s => (
                                    <button 
                                        key={s.id}
                                        onClick={() => onAssign(s.id)}
                                        className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-md hover:bg-indigo-100 transition-colors border border-indigo-100 dark:border-indigo-800"
                                    >
                                        {s.nickname}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const LogisticsStatusRow: React.FC<{ player: Player, counts: { jerseys: number, balls: number, water: number, kit: number } }> = ({ player, counts }) => {
    const total = counts.jerseys + counts.balls + counts.water + counts.kit;
    const isLazy = total === 0;

    return (
        <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isLazy ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
            <td className="p-3">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isLazy ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                    <img src={player.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                    <span className={`font-bold text-sm ${isLazy ? 'text-red-600' : 'text-gray-800 dark:text-gray-200'}`}>
                        {player.nickname} {isLazy && '(Pecador 🚩)'}
                    </span>
                </div>
            </td>
            <td className="p-3 text-center font-bold text-gray-600 dark:text-gray-400">{counts.jerseys > 0 ? counts.jerseys : '-'}</td>
            <td className="p-3 text-center font-bold text-gray-600 dark:text-gray-400">{counts.balls > 0 ? counts.balls : '-'}</td>
            <td className="p-3 text-center font-bold text-gray-600 dark:text-gray-400">{counts.water > 0 ? counts.water : '-'}</td>
            <td className="p-3 text-center font-bold text-gray-600 dark:text-gray-400">{counts.kit > 0 ? counts.kit : '-'}</td>
            <td className={`p-3 text-center font-black ${isLazy ? 'text-red-600' : 'text-indigo-600'}`}>{total}</td>
        </tr>
    );
};

export const LogisticsPage: React.FC<LogisticsPageProps> = ({ players, matches, selectedMatchId, onUpdateLogistics, isAdmin }) => {
    
    const selectedMatch = matches.find(m => m.id === selectedMatchId);
    
    const playerLogisticsStats = useMemo(() => {
        const stats = new Map<number, { jerseys: number, balls: number, water: number, kit: number }>();
        players.forEach(p => stats.set(p.id, { jerseys: 0, balls: 0, water: 0, kit: 0 }));

        matches.filter(m => m.status === 'FINALIZADO').forEach(match => {
            if (match.jerseyWasherId) { const s = stats.get(match.jerseyWasherId); if (s) s.jerseys++; }
            if (match.ballBringerId) { const s = stats.get(match.ballBringerId); if (s) s.balls++; }
            if (match.waterBringerId) { const s = stats.get(match.waterBringerId); if (s) s.water++; }
            if (match.medicineKitBringerId) { const s = stats.get(match.medicineKitBringerId); if (s) s.kit++; }
        });
        return stats;
    }, [matches, players]);

    const confirmedPlayers = useMemo(() => {
        if (!selectedMatch) return [];
        return players.filter(p => selectedMatch.playerStatuses.some(ps => ps.playerId === p.id && ps.attendanceStatus === 'CONFIRMED'));
    }, [selectedMatch, players]);

    const getSuggestions = (type: 'jerseys' | 'balls' | 'water' | 'kit') => {
        return [...confirmedPlayers].sort((a, b) => {
            const countA = playerLogisticsStats.get(a.id)?.[type] || 0;
            const countB = playerLogisticsStats.get(b.id)?.[type] || 0;
            if (countA !== countB) return countA - countB;
            return a.nickname.localeCompare(b.nickname);
        });
    };

    if (!selectedMatch) return (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <span className="text-6xl mb-4">🚪</span>
            <h2 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tighter">Entrando al Vestuario...</h2>
            <p className="text-gray-500 max-w-xs mt-2 italic">Selecciona un partido del Fixture o desde la pantalla principal para gestionar quién se encarga de las cosas.</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-12 animate-fadeIn">
            {/* Header Vestuario */}
            <div className="bg-indigo-950 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 opacity-10 text-[200px]">👕</div>
                <div className="relative z-10">
                    <h2 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
                        <span>🚪</span> El Vestuario
                    </h2>
                    <p className="text-indigo-300 font-bold mt-1">Reparto de tareas para el: {selectedMatch.date}</p>
                </div>
            </div>

            {/* Grid de Tareas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <ItemCard title="Lavar Ropa" icon="👕" value={selectedMatch.jerseyWasherId} players={players} onAssign={(id) => onUpdateLogistics(selectedMatch.id, 'jerseyWasherId', id)} suggestions={getSuggestions('jerseys')} isAdmin={isAdmin} colorClass="border-blue-500" />
                <ItemCard title="Traer Pelotas" icon="⚽" value={selectedMatch.ballBringerId} players={players} onAssign={(id) => onUpdateLogistics(selectedMatch.id, 'ballBringerId', id)} suggestions={getSuggestions('balls')} isAdmin={isAdmin} colorClass="border-green-500" />
                <ItemCard title="Hidratación" icon="💧" value={selectedMatch.waterBringerId} players={players} onAssign={(id) => onUpdateLogistics(selectedMatch.id, 'waterBringerId', id)} suggestions={getSuggestions('water')} isAdmin={isAdmin} colorClass="border-cyan-400" />
                <ItemCard title="Botiquín" icon="🚑" value={selectedMatch.medicineKitBringerId} players={players} onAssign={(id) => onUpdateLogistics(selectedMatch.id, 'medicineKitBringerId', id)} suggestions={getSuggestions('kit')} isAdmin={isAdmin} colorClass="border-red-500" />
            </div>

            {/* Ranking de los Pecadores */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border-2 border-red-100 dark:border-red-900/30">
                <div className="p-6 bg-red-50 dark:bg-red-950/20 border-b flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-red-800 dark:text-red-400 uppercase tracking-tighter">Ranking de Cumplimiento</h3>
                        <p className="text-xs text-red-600 font-bold uppercase mt-1">Los que menos colaboran están en la mira</p>
                    </div>
                    <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">HISTORIAL</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-900 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="p-4">Jugador</th>
                                <th className="p-4 text-center">👕</th>
                                <th className="p-4 text-center">⚽</th>
                                <th className="p-4 text-center">💧</th>
                                <th className="p-4 text-center">🚑</th>
                                <th className="p-4 text-center">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {players
                                .sort((a, b) => {
                                    const totalA = (playerLogisticsStats.get(a.id)?.jerseys || 0) + (playerLogisticsStats.get(a.id)?.balls || 0) + (playerLogisticsStats.get(a.id)?.water || 0) + (playerLogisticsStats.get(a.id)?.kit || 0);
                                    const totalB = (playerLogisticsStats.get(b.id)?.jerseys || 0) + (playerLogisticsStats.get(b.id)?.balls || 0) + (playerLogisticsStats.get(b.id)?.water || 0) + (playerLogisticsStats.get(b.id)?.kit || 0);
                                    return totalA - totalB;
                                })
                                .map(player => (
                                    <LogisticsStatusRow key={player.id} player={player} counts={playerLogisticsStats.get(player.id)!} />
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
