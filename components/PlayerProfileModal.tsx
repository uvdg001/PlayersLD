import React, { useMemo, useState } from 'react';
import type { Player, Match, Opponent } from '../types.ts';
import { AttendanceStatus } from '../types.ts';
import { StarRating } from './StarRating.tsx';
import { RoleIcon } from './icons.tsx';
import { useToast } from '../hooks/useToast.ts';

interface PlayerProfileModalProps {
    player: Player;
    matches: Match[];
    opponents: Opponent[];
    onClose: () => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({ player, matches, opponents, onClose }) => {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'history'>('overview');
    
    const stats = useMemo(() => {
        let played = 0, won = 0, drawn = 0, lost = 0;
        
        // Detailed Scoring
        let goalsTotal = 0;
        let goalsPlay = 0;
        let goalsHeader = 0;
        let goalsPenalty = 0;
        let goalsSetPiece = 0;
        let assists = 0;

        // Negative Stats
        let yellowCards = 0;
        let redCards = 0;
        let ownGoals = 0;
        let penaltiesMissed = 0;
        let majorErrors = 0; // Includes bad throw-ins/free-kicks for simplicity in summary

        // Ratings
        let ratingSum = 0;
        let ratingCount = 0;
        
        // Financials
        let totalPaidCourt = 0;
        let matchesOwed = 0; // Games played but marked as UNPAID

        // Participation
        let quartersPlayed = 0;
        let potentialQuarters = 0;

        const history = matches
            .filter(m => m.playerStatuses.some(ps => ps.playerId === player.id && ps.attendanceStatus === AttendanceStatus.CONFIRMED))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(match => {
                const ps = match.playerStatuses.find(s => s.playerId === player.id)!;
                played++;
                
                // Goals
                const gPlay = ps.goalsPlay || 0;
                const gHead = ps.goalsHeader || 0;
                const gPen = ps.goalsPenalty || 0;
                const gSet = ps.goalsSetPiece || 0;
                const matchGoals = gPlay + gHead + gPen + gSet;

                goalsPlay += gPlay;
                goalsHeader += gHead;
                goalsPenalty += gPen;
                goalsSetPiece += gSet;
                goalsTotal += matchGoals;
                assists += ps.assists || 0;

                // Negatives
                yellowCards += ps.yellowCards || 0;
                if (ps.redCard) redCards++;
                ownGoals += ps.ownGoals || 0;
                penaltiesMissed += ps.penaltiesMissed || 0;
                majorErrors += (ps.badThrowIns || 0) + (ps.badFreeKicks || 0) + (ps.majorErrors || 0);

                // Financials
                totalPaidCourt += ps.amountPaid || 0;
                if (match.status === 'FINALIZADO' && ps.paymentStatus === 'UNPAID') matchesOwed++;

                // Participation
                quartersPlayed += ps.quartersPlayed ?? 4;
                potentialQuarters += 4;

                // Ratings
                let matchRatingSum = 0;
                let matchRatingCount = 0;
                if (match.ratings) {
                    Object.values(match.ratings).forEach(raterRatings => {
                        if (raterRatings[player.id]) {
                            matchRatingSum += raterRatings[player.id];
                            matchRatingCount++;
                        }
                    });
                }
                const matchAvgRating = matchRatingCount > 0 ? matchRatingSum / matchRatingCount : 0;
                
                if (matchAvgRating > 0) {
                    ratingSum += matchAvgRating;
                    ratingCount++;
                }

                // Result Logic
                const opponent = opponents.find(o => o.id === match.opponentId);
                let result: 'V' | 'E' | 'D' | '-' = '-';
                const myTeamScore = matches.find(m => m.id === match.id)?.playerStatuses.reduce((total, ps) => total + (ps.goalsPlay || 0) + (ps.goalsPenalty || 0) + (ps.goalsHeader || 0) + (ps.goalsSetPiece || 0), 0) ?? 0;

                if (match.status === 'FINALIZADO' && typeof myTeamScore === 'number' && typeof match.opponentScore === 'number') {
                    if (myTeamScore > match.opponentScore) { result = 'V'; won++; }
                    else if (myTeamScore < match.opponentScore) { result = 'D'; lost++; }
                    else { result = 'E'; drawn++; }
                }

                const resultText = match.status === 'FINALIZADO' ? `${myTeamScore}-${match.opponentScore}` : '-';

                return {
                    date: match.date,
                    opponent: opponent?.name || 'Rival',
                    result,
                    resultText,
                    goals: matchGoals,
                    quarters: ps.quartersPlayed || 0,
                    rating: matchAvgRating,
                    paid: ps.amountPaid
                };
            });

        const avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0;
        const quartersPerc = potentialQuarters > 0 ? (quartersPlayed / potentialQuarters) * 100 : 0;

        return {
            played, won, drawn, lost,
            goalsTotal, goalsPlay, goalsHeader, goalsPenalty, goalsSetPiece, assists,
            yellowCards, redCards, ownGoals, penaltiesMissed, majorErrors,
            avgRating,
            totalPaidCourt, matchesOwed,
            quartersPerc,
            history
        };
    }, [player, matches, opponents]);

    const handleShareProfile = async () => {
        const shareText = `
*📊 Ficha: ${player.nickname}*
⭐ Calif: ${stats.avgRating.toFixed(1)}
⚽ Goles: ${stats.goalsTotal}
💰 Invertido: $${stats.totalPaidCourt}
🔥 Récord: ${stats.won}G - ${stats.drawn}E - ${stats.lost}P
`.trim();

        try {
            await navigator.clipboard.writeText(shareText);
            toast.success('Copiado al portapapeles');
        } catch (copyError) {
            console.error(copyError);
        }
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
    };

    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
    
    const ResultBadge: React.FC<{result: 'V' | 'E' | 'D' | '-'}> = ({result}) => {
        const styles = {
            'V': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            'E': 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300',
            'D': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            '-': 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
        };
        return <span className={`w-6 h-6 flex items-center justify-center font-bold text-xs rounded-full ${styles[result]}`}>{result}</span>
    };

    const TabButton = ({ id, label, icon }: { id: 'overview' | 'stats' | 'history', label: string, icon: string }) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === id ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
        >
            <span>{icon}</span> {label}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[60] p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* 1. Header Profile */}
                 <div className="p-6 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-b dark:border-gray-700">
                     <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                {player.photoUrl ? (
                                    <img src={player.photoUrl} alt={player.nickname} className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl">👤</div>
                                )}
                                {player.jerseyNumber && (
                                    <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white dark:border-gray-800 shadow-sm">
                                        {player.jerseyNumber}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-800 dark:text-white leading-none">{player.nickname}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{player.firstName} {player.lastName}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                                        <RoleIcon role={player.role} className="w-3 h-3" /> {player.role}
                                    </div>
                                    <StarRating rating={player.skillLevel} size="text-xs" />
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2">✕</button>
                    </div>
                </div>

                {/* 2. Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <TabButton id="overview" label="Resumen" icon="📊" />
                    <TabButton id="stats" label="Detalle Goles" icon="⚽" />
                    <TabButton id="history" label="Historial" icon="📅" />
                </div>

                {/* 3. Content Area */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50">
                    
                    {/* TAB: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="space-y-4 animate-fadeIn">
                            {/* Key KPIs */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm text-center border border-gray-100 dark:border-gray-700">
                                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.played}</p>
                                    <p className="text-[10px] uppercase font-bold text-gray-400">Partidos</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm text-center border border-gray-100 dark:border-gray-700">
                                    <p className="text-2xl font-black text-green-600 dark:text-green-400">{stats.goalsTotal}</p>
                                    <p className="text-[10px] uppercase font-bold text-gray-400">Goles</p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm text-center border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center justify-center gap-1 text-yellow-500">
                                        <span className="text-2xl font-black">{stats.avgRating.toFixed(1)}</span>
                                        <span className="text-sm">★</span>
                                    </div>
                                    <p className="text-[10px] uppercase font-bold text-gray-400">Promedio</p>
                                </div>
                            </div>

                            {/* Record Bar */}
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                <h4 className="text-xs font-bold uppercase text-gray-500 mb-3">Rendimiento del Equipo (con {player.nickname})</h4>
                                <div className="flex h-4 rounded-full overflow-hidden w-full bg-gray-200">
                                    <div className="bg-green-500 h-full" style={{ width: `${(stats.won / stats.played) * 100}%` }} title={`${stats.won} Ganados`}></div>
                                    <div className="bg-gray-400 h-full" style={{ width: `${(stats.drawn / stats.played) * 100}%` }} title={`${stats.drawn} Empatados`}></div>
                                    <div className="bg-red-500 h-full" style={{ width: `${(stats.lost / stats.played) * 100}%` }} title={`${stats.lost} Perdidos`}></div>
                                </div>
                                <div className="flex justify-between text-xs mt-2 font-semibold text-gray-600 dark:text-gray-400">
                                    <span className="text-green-600">{stats.won} Ganados</span>
                                    <span>{stats.drawn} Empates</span>
                                    <span className="text-red-600">{stats.lost} Perdidos</span>
                                </div>
                            </div>

                            {/* Negativos (Salón de la vergüenza) */}
                            {(stats.redCards > 0 || stats.yellowCards > 0 || stats.ownGoals > 0 || stats.penaltiesMissed > 0) && (
                                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                                    <h4 className="text-xs font-bold uppercase text-red-600 mb-3">⚠️ Zona Disciplinaria</h4>
                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        <div className="bg-white dark:bg-red-900/20 p-2 rounded">
                                            <p className="text-xl">🟨</p>
                                            <p className="font-bold text-gray-700 dark:text-red-200">{stats.yellowCards}</p>
                                        </div>
                                        <div className="bg-white dark:bg-red-900/20 p-2 rounded">
                                            <p className="text-xl">🟥</p>
                                            <p className="font-bold text-gray-700 dark:text-red-200">{stats.redCards}</p>
                                        </div>
                                        <div className="bg-white dark:bg-red-900/20 p-2 rounded" title="Goles en Contra">
                                            <p className="text-xl">🥅</p>
                                            <p className="font-bold text-gray-700 dark:text-red-200">{stats.ownGoals}</p>
                                        </div>
                                        <div className="bg-white dark:bg-red-900/20 p-2 rounded" title="Penales Errados">
                                            <p className="text-xl">❌</p>
                                            <p className="font-bold text-gray-700 dark:text-red-200">{stats.penaltiesMissed}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Financials */}
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-xs font-bold uppercase text-blue-600">Tesorería Personal</h4>
                                    {stats.matchesOwed > 0 && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded">Debe {stats.matchesOwed} partidos</span>}
                                </div>
                                <div className="flex items-end gap-2">
                                    <p className="text-3xl font-black text-gray-800 dark:text-white">{formatter.format(stats.totalPaidCourt)}</p>
                                    <p className="text-sm text-gray-500 mb-1">invertidos en canchas</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: STATS DETAIL */}
                    {activeTab === 'stats' && (
                        <div className="space-y-6 animate-fadeIn bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 border-b pb-2 dark:border-gray-700">Desglose de Goles ({stats.goalsTotal})</h3>
                            
                            {stats.goalsTotal === 0 ? (
                                <p className="text-center text-gray-400 py-8 italic">Aún no ha convertido goles.</p>
                            ) : (
                                <div className="space-y-4">
                                    {/* Jugada */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="flex items-center gap-2"><span className="text-lg">⚽</span> Jugada</span>
                                            <span className="font-bold">{stats.goalsPlay}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="bg-green-500 h-full" style={{ width: `${(stats.goalsPlay / stats.goalsTotal) * 100}%` }}></div>
                                        </div>
                                    </div>
                                    
                                    {/* Cabeza */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="flex items-center gap-2"><span className="text-lg">🧠</span> Cabeza</span>
                                            <span className="font-bold">{stats.goalsHeader}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="bg-purple-500 h-full" style={{ width: `${(stats.goalsHeader / stats.goalsTotal) * 100}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Penal */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="flex items-center gap-2"><span className="text-lg">🎯</span> Penal</span>
                                            <span className="font-bold">{stats.goalsPenalty}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="bg-blue-500 h-full" style={{ width: `${(stats.goalsPenalty / stats.goalsTotal) * 100}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Tiro Libre */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="flex items-center gap-2"><span className="text-lg">👟</span> Tiro Libre</span>
                                            <span className="font-bold">{stats.goalsSetPiece}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="bg-orange-500 h-full" style={{ width: `${(stats.goalsSetPiece / stats.goalsTotal) * 100}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 mt-4 border-t dark:border-gray-700">
                                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">🅰️</span>
                                        <span className="font-semibold text-blue-800 dark:text-blue-300">Asistencias</span>
                                    </div>
                                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.assists}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: HISTORY */}
                    {activeTab === 'history' && (
                        <div className="animate-fadeIn">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                                    <tr>
                                        <th className="px-2 py-2 text-center">R</th>
                                        <th className="px-2 py-2">Fecha/Rival</th>
                                        <th className="px-2 py-2 text-center">⚽</th>
                                        <th className="px-2 py-2 text-center">⭐</th>
                                        <th className="px-2 py-2 text-right">$</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {stats.history.map((match, idx) => (
                                        <tr key={idx} className="bg-white dark:bg-gray-800">
                                            <td className="px-2 py-3 text-center"><ResultBadge result={match.result} /></td>
                                            <td className="px-2 py-3">
                                                <div className="font-bold text-gray-800 dark:text-white">{match.date.split(',')[0]}</div>
                                                <div className="text-xs text-gray-500">{match.opponent} <span className="opacity-70">({match.resultText})</span></div>
                                            </td>
                                            <td className="px-2 py-3 text-center font-bold text-green-600">{match.goals > 0 ? match.goals : '-'}</td>
                                            <td className="px-2 py-3 text-center font-semibold text-yellow-600">{match.rating > 0 ? match.rating.toFixed(1) : '-'}</td>
                                            <td className="px-2 py-3 text-right text-gray-600 dark:text-gray-400 text-xs">{match.paid > 0 ? 'Pagó' : 'Debe'}</td>
                                        </tr>
                                    ))}
                                    {stats.history.length === 0 && (
                                        <tr><td colSpan={5} className="p-4 text-center text-gray-400">Sin partidos jugados.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
                    <button onClick={handleShareProfile} className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        Compartir Resumen
                    </button>
                    {(player.phone || player.email) && activeTab === 'overview' && (
                        <div className="flex gap-2">
                            {player.phone && <a href={`tel:${player.phone}`} className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200">📞</a>}
                            {player.email && <a href={`mailto:${player.email}`} className="p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200">📧</a>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};