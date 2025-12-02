import React, { useMemo } from 'react';
import type { Player, Match, AttendanceStatus } from '../../types.ts';
import { PlayerRole } from '../../types.ts';

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
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 ${colorClass}`}>
            <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{icon}</span>
                <h3 className="font-bold text-gray-800 dark:text-gray-100">{title}</h3>
            </div>
            
            <div className="mb-3">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Asignado a:</p>
                {assignedPlayer ? (
                    <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <img src={assignedPlayer.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <span className="font-semibold">{assignedPlayer.nickname}</span>
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 italic">Nadie asignado aún</p>
                )}
            </div>

            {isAdmin && (
                <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Asignar / Cambiar:</label>
                    <select
                        value={value || ''}
                        onChange={(e) => onAssign(Number(e.target.value))}
                        className="w-full text-sm rounded-md border-gray-300 shadow-sm bg-gray-50 dark:bg-gray-900 dark:border-gray-600 p-2"
                    >
                        <option value="">Seleccionar...</option>
                        {players.sort((a, b) => a.nickname.localeCompare(b.nickname)).map(p => (
                            <option key={p.id} value={p.id}>{p.nickname}</option>
                        ))}
                    </select>
                    {suggestions.length > 0 && (
                        <div className="mt-2">
                            <p className="text-[10px] text-green-600 dark:text-green-400 font-bold mb-1">SUGERIDOS (Le toca a):</p>
                            <div className="flex flex-wrap gap-1">
                                {suggestions.slice(0, 3).map(s => (
                                    <button 
                                        key={s.id}
                                        onClick={() => onAssign(s.id)}
                                        className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded hover:bg-green-200 transition-colors"
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
    
    // Logic for "Traffic Light" status
    let statusColor = "bg-green-500"; // Good
    if (total === 0) statusColor = "bg-red-500"; // Bad (hasn't brought anything)
    else if (total === 1) statusColor = "bg-yellow-500"; // Warning

    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <td className="p-3">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${statusColor} shadow-sm`}></div>
                    <img src={player.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{player.nickname}</span>
                </div>
            </td>
            <td className="p-3 text-center">{counts.jerseys > 0 ? counts.jerseys : <span className="text-gray-300">-</span>}</td>
            <td className="p-3 text-center">{counts.balls > 0 ? counts.balls : <span className="text-gray-300">-</span>}</td>
            <td className="p-3 text-center">{counts.water > 0 ? counts.water : <span className="text-gray-300">-</span>}</td>
            <td className="p-3 text-center">{counts.kit > 0 ? counts.kit : <span className="text-gray-300">-</span>}</td>
            <td className="p-3 text-center font-bold">{total}</td>
        </tr>
    );
};

export const LogisticsPage: React.FC<LogisticsPageProps> = ({ players, matches, selectedMatchId, onUpdateLogistics, isAdmin }) => {
    
    const selectedMatch = matches.find(m => m.id === selectedMatchId);
    
    // 1. Calculate History Stats
    const playerLogisticsStats = useMemo(() => {
        const stats = new Map<number, { jerseys: number, balls: number, water: number, kit: number }>();
        
        // Initialize
        players.forEach(p => stats.set(p.id, { jerseys: 0, balls: 0, water: 0, kit: 0 }));

        matches.filter(m => m.status === 'FINALIZADO').forEach(match => {
            if (match.jerseyWasherId) {
                const s = stats.get(match.jerseyWasherId);
                if (s) s.jerseys++;
            }
            if (match.ballBringerId) {
                const s = stats.get(match.ballBringerId);
                if (s) s.balls++;
            }
            if (match.waterBringerId) {
                const s = stats.get(match.waterBringerId);
                if (s) s.water++;
            }
            if (match.medicineKitBringerId) {
                const s = stats.get(match.medicineKitBringerId);
                if (s) s.kit++;
            }
        });
        return stats;
    }, [matches, players]);

    // 2. Logic for Suggestions based on CONFIRMED players for the selected match
    const confirmedPlayers = useMemo(() => {
        if (!selectedMatch) return [];
        return players.filter(p => selectedMatch.playerStatuses.some(ps => ps.playerId === p.id && ps.attendanceStatus === 'CONFIRMED'));
    }, [selectedMatch, players]);

    const getSuggestions = (type: 'jerseys' | 'balls' | 'water' | 'kit') => {
        return [...confirmedPlayers].sort((a, b) => {
            const countA = playerLogisticsStats.get(a.id)?.[type] || 0;
            const countB = playerLogisticsStats.get(b.id)?.[type] || 0;
            if (countA !== countB) return countA - countB; // Ascending: less is better (priority)
            return a.nickname.localeCompare(b.nickname);
        });
    };

    if (!selectedMatch) return <div className="text-center p-8">Selecciona un partido en la pantalla principal o fixture para gestionar la utilería.</div>;

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Utilería y Logística</h2>
                <div className="bg-indigo-100 dark:bg-indigo-900/30 px-4 py-2 rounded-lg">
                    <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">Gestionando: </span>
                    <span className="font-bold text-indigo-900 dark:text-white">{selectedMatch.date}</span>
                </div>
            </div>

            {/* Assignment Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ItemCard 
                    title="Camisetas" 
                    icon="👕" 
                    value={selectedMatch.jerseyWasherId} 
                    players={players} 
                    onAssign={(id) => onUpdateLogistics(selectedMatch.id, 'jerseyWasherId', id)}
                    suggestions={getSuggestions('jerseys')}
                    isAdmin={isAdmin}
                    colorClass="border-blue-500"
                />
                <ItemCard 
                    title="Pelotas" 
                    icon="⚽" 
                    value={selectedMatch.ballBringerId} 
                    players={players} 
                    onAssign={(id) => onUpdateLogistics(selectedMatch.id, 'ballBringerId', id)}
                    suggestions={getSuggestions('balls')}
                    isAdmin={isAdmin}
                    colorClass="border-green-500"
                />
                <ItemCard 
                    title="Agua / Hielo" 
                    icon="💧" 
                    value={selectedMatch.waterBringerId} 
                    players={players} 
                    onAssign={(id) => onUpdateLogistics(selectedMatch.id, 'waterBringerId', id)}
                    suggestions={getSuggestions('water')}
                    isAdmin={isAdmin}
                    colorClass="border-cyan-400"
                />
                <ItemCard 
                    title="Botiquín" 
                    icon="🚑" 
                    value={selectedMatch.medicineKitBringerId} 
                    players={players} 
                    onAssign={(id) => onUpdateLogistics(selectedMatch.id, 'medicineKitBringerId', id)}
                    suggestions={getSuggestions('kit')}
                    isAdmin={isAdmin}
                    colorClass="border-red-500"
                />
            </div>

            {/* Status Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Estado de Cumplimiento</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                                <th className="p-3 text-sm font-bold text-gray-600 dark:text-gray-400 uppercase">Jugador</th>
                                <th className="p-3 text-center text-xl">👕</th>
                                <th className="p-3 text-center text-xl">⚽</th>
                                <th className="p-3 text-center text-xl">💧</th>
                                <th className="p-3 text-center text-xl">🚑</th>
                                <th className="p-3 text-center text-sm font-bold text-gray-600 dark:text-gray-400 uppercase">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {players
                                .sort((a, b) => {
                                    const totalA = (playerLogisticsStats.get(a.id)?.jerseys || 0) + (playerLogisticsStats.get(a.id)?.balls || 0) + (playerLogisticsStats.get(a.id)?.water || 0);
                                    const totalB = (playerLogisticsStats.get(b.id)?.jerseys || 0) + (playerLogisticsStats.get(b.id)?.balls || 0) + (playerLogisticsStats.get(b.id)?.water || 0);
                                    return totalA - totalB; // Ascending order (least compliant first)
                                })
                                .map(player => (
                                    <LogisticsStatusRow key={player.id} player={player} counts={playerLogisticsStats.get(player.id)!} />
                                ))
                            }
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Historical Log */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Historial Detallado</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="p-3 rounded-tl-lg">Fecha</th>
                                <th className="p-3">Rival</th>
                                <th className="p-3">👕 Camisetas</th>
                                <th className="p-3">⚽ Pelotas</th>
                                <th className="p-3">💧 Agua</th>
                                <th className="p-3 rounded-tr-lg">🚑 Botiquín</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {matches
                                .filter(m => m.status === 'FINALIZADO')
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map(match => {
                                    const washer = players.find(p => p.id === match.jerseyWasherId);
                                    const ballBringer = players.find(p => p.id === match.ballBringerId);
                                    const waterBringer = players.find(p => p.id === match.waterBringerId);
                                    const kitBringer = players.find(p => p.id === match.medicineKitBringerId);
                                    
                                    return (
                                        <tr key={match.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="p-3 font-medium">{match.date}</td>
                                            <td className="p-3 text-gray-500">vs Rival</td>
                                            <td className="p-3 font-semibold text-blue-600 dark:text-blue-400">{washer?.nickname || '-'}</td>
                                            <td className="p-3 font-semibold text-green-600 dark:text-green-400">{ballBringer?.nickname || '-'}</td>
                                            <td className="p-3 font-semibold text-cyan-600 dark:text-cyan-400">{waterBringer?.nickname || '-'}</td>
                                            <td className="p-3 font-semibold text-red-600 dark:text-red-400">{kitBringer?.nickname || '-'}</td>
                                        </tr>
                                    );
                                })
                            }
                            {matches.filter(m => m.status === 'FINALIZADO').length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-4 text-center text-gray-500">No hay historial disponible.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};