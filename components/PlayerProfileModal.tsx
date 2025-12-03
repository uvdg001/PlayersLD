import React, { useMemo } from 'react';
import type { Player, Match, Opponent, PlayerRole } from '../types.ts';
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
    
    const stats = useMemo(() => {
        let played = 0, won = 0, drawn = 0, lost = 0;
        let goals = 0;
        let ratingSum = 0;
        let ratingCount = 0;
        let totalPaid = 0;
        let quartersPlayed = 0;
        let potentialQuarters = 0;

        const history = matches
            .filter(m => m.playerStatuses.some(ps => ps.playerId === player.id && ps.attendanceStatus === AttendanceStatus.CONFIRMED))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(match => {
                const ps = match.playerStatuses.find(s => s.playerId === player.id)!;
                played++;
                goals += (ps.goalsPlay || 0) + (ps.goalsPenalty || 0) + (ps.goalsHeader || 0) + (ps.goalsSetPiece || 0);
                totalPaid += ps.amountPaid || 0;
                quartersPlayed += ps.quartersPlayed || 0;
                potentialQuarters += 4;

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
                    goals: (ps.goalsPlay || 0) + (ps.goalsPenalty || 0) + (ps.goalsHeader || 0) + (ps.goalsSetPiece || 0),
                    quarters: ps.quartersPlayed || 0,
                    rating: matchAvgRating,
                    paid: ps.amountPaid
                };
            });

        const avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0;
        const quartersPerc = potentialQuarters > 0 ? (quartersPlayed / potentialQuarters) * 100 : 0;

        return {
            played, won, drawn, lost,
            goals,
            avgRating,
            totalPaid,
            quartersPerc,
            history
        };
    }, [player, matches, opponents]);

    const handleShareProfile = async () => {
        const shareText = `
*📊 Ficha de Jugador: ${player.nickname}*

*⭐ Calificación General:* ${stats.avgRating.toFixed(1)} ★
*🏟️ Partidos Jugados:* ${stats.played}
*⚽ Goles Totales:* ${stats.goals}
*📈 Récord:* ${stats.won}G - ${stats.drawn}E - ${stats.lost}P

¡Un crack! 🔥
        `;

        try {
            if (navigator.share) {
                await navigator.share({ title: `Ficha de ${player.nickname}`, text: shareText.trim() });
            } else {
                throw new Error('Share API not available');
            }
        } catch (error) {
            console.error("Error al compartir:", error);
            try {
                await navigator.clipboard.writeText(shareText.trim());
                toast.success('¡Ficha copiada al portapapeles!');
            } catch (copyError) {
                toast.error('No se pudo compartir ni copiar.');
            }
        }
    };

    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
    
    const ResultBadge: React.FC<{result: 'V' | 'E' | 'D' | '-'}> = ({result}) => {
        const styles = {
            'V': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            'E': 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300',
            'D': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
            '-': 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-300'
        };
        return <span className={`w-6 h-6 flex items-center justify-center font-bold text-xs rounded-full ${styles[result]}`}>{result}</span>
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[60] p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                 <div className="p-6 border-b dark:border-gray-700">
                     <div className="flex items-start space-x-4">
                        <div className="relative">
                            {player.photoUrl ? (
                                <img src={player.photoUrl} alt={player.nickname} className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600 shadow-md" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200 dark:border-gray-600 shadow-md text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                                </div>
                            )}
                            {player.jerseyNumber && (
                                <div className="absolute -top-1 -right-1 bg-gray-800 text-white w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold border-2 border-white dark:border-gray-800">
                                    {player.jerseyNumber}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                             <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{player.firstName} "{player.nickname}" {player.lastName}</h2>
                             <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-gray-400">
                                <RoleIcon role={player.role} className="w-5 h-5" />
                                <span>{player.role}</span>
                            </div>
                            {player.alternativeRoles && player.alternativeRoles.length > 0 && (
                                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold">También juega de:</span> {player.alternativeRoles.join(', ')}
                                </div>
                            )}
                            <div className="mt-2">
                                <StarRating rating={player.skillLevel} size="text-lg" />
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <button onClick={onClose} className="self-start text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                             <button onClick={handleShareProfile} className="mt-auto px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                                Compartir Ficha
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-700/50">
                    <div className="text-center p-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Promedio</p>
                        <div className="flex items-center justify-center gap-1">
                            <span className="text-xl font-bold text-yellow-500">{stats.avgRating.toFixed(1)}</span>
                            <span className="text-xs text-gray-400">★</span>
                        </div>
                    </div>
                    <div className="text-center p-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Partidos</p>
                        <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{stats.played}</p>
                    </div>
                    <div className="text-center p-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Goles</p>
                        <p className="text-xl font-bold text-green-600">{stats.goals}</p>
                    </div>
                    <div className="text-center p-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">% Jugado</p>
                        <p className="text-xl font-bold text-blue-600">{Math.round(stats.quartersPerc)}%</p>
                    </div>
                </div>

                {/* History Table */}
                <div className="flex-1 overflow-y-auto p-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3">Historial de Partidos</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-center">Res.</th>
                                    <th className="px-3 py-2">Fecha</th>
                                    <th className="px-3 py-2">Rival y Marcador</th>
                                    <th className="px-3 py-2 text-center">Goles</th>
                                    <th className="px-3 py-2 text-center">1/4s</th>
                                    <th className="px-3 py-2 text-center">Calif.</th>
                                    <th className="px-3 py-2 text-right">Pago</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {stats.history.map((match, idx) => (
                                    <tr key={idx} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-3 py-2 text-center"><ResultBadge result={match.result} /></td>
                                        <td className="px-3 py-2 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                            {match.date.split(',')[0]}
                                        </td>
                                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                                            {match.opponent} <span className="text-xs text-gray-400">({match.resultText})</span>
                                        </td>
                                        <td className="px-3 py-2 text-center font-bold text-green-600">{match.goals > 0 ? match.goals : '-'}</td>
                                        <td className="px-3 py-2 text-center">{match.quarters}</td>
                                        <td className="px-3 py-2 text-center">
                                            {match.rating > 0 ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200">
                                                    {match.rating.toFixed(1)}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{formatter.format(match.paid)}</td>
                                    </tr>
                                ))}
                                 {stats.history.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4 text-gray-500 dark:text-gray-400">
                                            Este jugador aún no ha disputado partidos.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
