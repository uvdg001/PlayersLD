import React, { useMemo, useState } from 'react';
import type { PlayerStats, Player, Match, Opponent, ThirdHalfItem, Tournament } from '../../types.ts';
import { AttendanceStatus, PlayerRole } from '../../types.ts';

interface StatisticsPageProps {
    stats: PlayerStats[];
    canViewRatings: boolean;
    onViewProfile: (player: Player) => void;
    teamPenaltiesAgainst: number;
    matches?: Match[];
    opponents: Opponent[];
    tournaments?: Tournament[];
    isAdmin?: boolean;
}

const StatCard: React.FC<{ title: string; children: React.ReactNode, icon?: string, className?: string }> = ({ title, children, icon, className }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 ${className} border border-gray-100 dark:border-gray-700`}>
        <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2 italic uppercase tracking-tighter">
            {icon && <span className="text-2xl filter drop-shadow-sm">{icon}</span>}
            {title}
        </h3>
        {children}
    </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <p className="text-center py-8 text-gray-500 dark:text-gray-400 font-bold italic">{message}</p>
);

const TableHeader: React.FC<{ columns: string[] }> = ({ columns }) => (
    <thead className="bg-gray-100 dark:bg-gray-900 border-b-2 dark:border-gray-700">
        <tr>
            {columns.map((col, i) => (
                <th key={i} className={`p-4 text-[10px] font-black tracking-widest uppercase text-gray-500 ${i === 0 ? 'text-left' : 'text-center'}`}>{col}</th>
            ))}
        </tr>
    </thead>
);

const Podium: React.FC<{ top3: PlayerStats[], onViewProfile: (p: Player) => void }> = ({ top3, onViewProfile }) => {
    if (top3.length === 0) return <EmptyState message="Sin votos en este período." />;
    const [first, second, third] = top3;
    const PodiumItem = ({ stat, position, color, height }: { stat: PlayerStats | undefined, position: number, color: string, height: string }) => {
        if (!stat) return <div className="flex-1"></div>;
        return (
            <div 
                className="flex flex-col items-center justify-end flex-1 cursor-pointer group"
                onClick={() => onViewProfile(stat.player)}
            >
                 <div className="relative mb-3 transform group-hover:scale-110 transition-transform">
                    <img src={stat.player.photoUrl} alt={stat.player.nickname} className={`w-16 h-16 rounded-full border-4 ${color} object-cover shadow-xl`} />
                    <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full ${color} flex items-center justify-center text-white font-black text-sm shadow-md border-2 border-white`}>
                        {position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉'}
                    </div>
                </div>
                <p className="font-black text-xs text-center truncate w-full uppercase tracking-tighter group-hover:text-indigo-600 transition-colors">{stat.player.nickname}</p>
                <p className="text-[10px] font-black text-yellow-500 mb-2">{stat.avgRating.toFixed(2)} ★</p>
                <div className={`w-full ${color} rounded-t-2xl opacity-60 group-hover:opacity-100 transition-opacity`} style={{ height }}></div>
            </div>
        );
    }
    return (
        <div className="flex items-end justify-center h-56 gap-3 mb-6 px-4">
            <PodiumItem stat={second} position={2} color="bg-gray-400" height="45%" />
            <PodiumItem stat={first} position={1} color="bg-yellow-400" height="70%" />
            <PodiumItem stat={third} position={3} color="bg-orange-400" height="35%" />
        </div>
    );
};

export const StatisticsPage: React.FC<StatisticsPageProps> = ({ stats, canViewRatings, onViewProfile, teamPenaltiesAgainst, matches = [], opponents, tournaments = [], isAdmin }) => {
    const [view, setView] = useState<'total' | 'match' | 'credits'>('total');
    const [timeRange, setTimeRange] = useState<'WEEK' | 'MONTH' | 'ALL' | number>('ALL');
    const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

    const filteredMatches = useMemo(() => {
        let base = matches.filter(m => m.status === 'FINALIZADO');
        const now = new Date();
        
        if (typeof timeRange === 'number') {
            base = base.filter(m => m.tournamentId === timeRange);
        } else if (timeRange === 'WEEK') {
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            base = base.filter(m => new Date(m.date).getTime() >= lastWeek.getTime());
        } else if (timeRange === 'MONTH') {
            const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            base = base.filter(m => new Date(m.date).getTime() >= lastMonth.getTime());
        }
        return base.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [matches, timeRange]);

    const filteredStats: PlayerStats[] = useMemo(() => {
        return stats.map(playerStat => {
            const playerMatches = filteredMatches.filter(m => m.playerStatuses.some(ps => ps.playerId === playerStat.player.id && ps.attendanceStatus === AttendanceStatus.CONFIRMED));
            
            let goalsPlay = 0, goalsPenalty = 0, goalsHeader = 0, goalsSetPiece = 0, assists = 0, yellowCards = 0, totalAmountPaid = 0, ratingSum = 0, ratingCount = 0;
            let redCards = 0;

            playerMatches.forEach(m => {
                const ps = m.playerStatuses.find(s => s.playerId === playerStat.player.id)!;
                const extraGoals = (ps.goals || 0);
                goalsPlay += (ps.goalsPlay || 0) + extraGoals;
                goalsPenalty += (ps.goalsPenalty || 0);
                goalsHeader += (ps.goalsHeader || 0);
                goalsSetPiece += (ps.goalsSetPiece || 0);
                assists += (ps.assists || 0);
                yellowCards += (ps.yellowCards || 0);
                if (ps.redCard) redCards++;
                totalAmountPaid += (ps.amountPaid || 0);
                if (m.ratings) {
                    Object.values(m.ratings).forEach(raterRatings => {
                        if (raterRatings[playerStat.player.id]) { ratingSum += raterRatings[playerStat.player.id]; ratingCount++; }
                    });
                }
            });

            return {
                ...playerStat,
                pj: playerMatches.length,
                totalGoals: goalsPlay + goalsPenalty + goalsHeader + goalsSetPiece,
                goalsPlay, goalsPenalty, goalsHeader, goalsSetPiece, assists, yellowCards, redCards, totalAmountPaid,
                avgRating: ratingCount > 0 ? ratingSum / ratingCount : 0,
                ratingCount,
            } as PlayerStats;
        }).filter(s => s.pj > 0);
    }, [stats, filteredMatches]);

    const finishedMatches = useMemo(() => filteredMatches.filter(m => m.status === 'FINALIZADO'), [filteredMatches]);
    const selectedMatch = useMemo(() => selectedMatchId ? finishedMatches.find(m => m.id === selectedMatchId) : null, [selectedMatchId, finishedMatches]);

    const perMatchStats = useMemo(() => {
        if (!selectedMatch) return null;
        const confirmedPlayers = selectedMatch.playerStatuses
            .filter(ps => ps.attendanceStatus === 'CONFIRMED')
            .map(ps => {
                const player = stats.find(s => s.player.id === ps.playerId)?.player;
                if (!player) return null;
                const totalGoals = (ps.goalsPlay || 0) + (ps.goalsPenalty || 0) + (ps.goalsHeader || 0) + (ps.goalsSetPiece || 0);
                
                // Calcular promedio de este partido puntual
                let sum = 0, count = 0;
                if (selectedMatch.ratings) {
                    Object.values(selectedMatch.ratings).forEach(raterRatings => {
                        if (raterRatings[player.id]) { sum += raterRatings[player.id]; count++; }
                    });
                }
                const matchAvg = count > 0 ? sum / count : 0;

                return { player, ...ps, totalGoals, matchAvg, matchVotes: count };
            })
            .filter((p): p is NonNullable<typeof p> => p !== null);
        
        const goalScorers = confirmedPlayers.filter(p => p.totalGoals > 0).sort((a, b) => b.totalGoals - a.totalGoals);
        const matchRanking = confirmedPlayers.filter(p => p.matchAvg > 0).sort((a, b) => b.matchAvg - a.matchAvg);
        
        return { goalScorers, matchRanking };
    }, [selectedMatch, stats]);

    const fantasyRanking = useMemo(() => {
        return filteredStats.map(stat => {
            let credits = 0;
            const myMatches = filteredMatches.filter(m => m.playerStatuses.some(ps => ps.playerId === stat.player.id && ps.attendanceStatus === AttendanceStatus.CONFIRMED));
            
            credits += (myMatches.length * 2);
            myMatches.forEach(m => {
                const ps = m.playerStatuses.find(p => p.playerId === stat.player.id)!;
                credits += (ps.goalsPlay || 0) * 3;
                credits += (ps.goalsHeader || 0) * 5;
                credits += (ps.goalsPenalty || 0) * 3;
                credits += (ps.goalsSetPiece || 0) * 4;
                credits += (ps.assists || 0) * 2;
                credits -= (ps.yellowCards || 0) * 2;
                if (ps.redCard) credits -= 5;
                credits -= (ps.ownGoals || 0) * 5;
                credits -= (ps.penaltiesMissed || 0) * 3;
                credits -= (ps.majorErrors || 0) * 2;

                if (m.opponentScore === 0 && (stat.player.role === PlayerRole.ARQUERO || stat.player.role.includes('Defensa'))) {
                    credits += 5;
                }
            });

            if (stat.player.gamePoints) credits += Math.round(stat.player.gamePoints / 10);
            return { ...stat, credits, filteredPJ: myMatches.length };
        }).sort((a, b) => b.credits - a.credits);
    }, [filteredStats, filteredMatches]);

    const goalScorers = [...filteredStats].sort((a, b) => b.totalGoals - a.totalGoals);
    const ratingRanking = [...filteredStats].filter(s => s.avgRating > 0).sort((a, b) => b.avgRating - a.avgRating);
    const disciplineRanking = [...filteredStats]
        .filter(s => s.yellowCards > 0 || s.redCards > 0)
        .sort((a, b) => (b.redCards * 2 + b.yellowCards) - (a.redCards * 2 + a.yellowCards));
    
    const thirdHalfStats = useMemo(() => {
        let totalBeerLitros = 0, totalSpentThirdHalf = 0, totalSpentCourt = 0;
        filteredMatches.forEach(m => {
            totalSpentCourt += m.courtFee;
            if (m.thirdHalf) {
                totalSpentThirdHalf += m.thirdHalf.totalSpent;
                m.thirdHalf.items.forEach((item: ThirdHalfItem) => {
                    if (item.id === 'beer') totalBeerLitros += item.quantity;
                });
            }
        });
        const grandTotal = totalSpentCourt + totalSpentThirdHalf;
        return { 
            totalBeerLitros, 
            totalSpentThirdHalf, 
            totalSpentCourt, 
            courtPerc: grandTotal > 0 ? (totalSpentCourt / grandTotal) * 100 : 50, 
            thirdHalfPerc: grandTotal > 0 ? (totalSpentThirdHalf / grandTotal) * 100 : 50 
        };
    }, [filteredMatches]);

    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

    const handleShareStatsWA = () => {
        const rangeText = timeRange === 'WEEK' ? 'de la Semana' : timeRange === 'MONTH' ? 'del Mes' : 'Histórico';
        let text = `*📊 RESUMEN ESTADÍSTICO PLAYERS (${rangeText})*\n`;
        text += `--------------------------------\n\n`;

        if (view === 'credits') {
            text += `*💰 RANKING FANTASY CREDITS*\n`;
            fantasyRanking.slice(0, 10).forEach((s, i) => {
                text += `${i + 1}. *${s.player.nickname}*: ${s.credits} pts\n`;
            });
            text += `\n_El Fantasy suma Goles, Vallas Invictas y Créditos Arcade._\n`;
        } else if (view === 'total') {
            text += `*⭐ RANKING DE VALORACIÓN*\n`;
            ratingRanking.forEach((s, i) => {
                const medal = i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : `${i + 1}. `;
                text += `${medal}*${s.player.nickname}*: ${s.avgRating.toFixed(2)} ★\n`;
            });

            text += `\n*⚽ TOP GOLEADORES*\n`;
            goalScorers.slice(0, 5).forEach((s, i) => {
                text += `${i + 1}. *${s.player.nickname}*: ${s.totalGoals} goles\n`;
            });

            text += `\n*🍻 VICIOS & FINANZAS*\n`;
            text += `- Cerveza consumida: ${thirdHalfStats.totalBeerLitros}L 🍺\n`;
            text += `- Inversión 3er Tiempo: ${formatter.format(thirdHalfStats.totalSpentThirdHalf)}\n`;
            text += `- Relación: ${Math.round(thirdHalfStats.thirdHalfPerc)}% Joda / ${Math.round(thirdHalfStats.courtPerc)}% Fútbol\n`;
        } else if (view === 'match' && selectedMatch) {
            const opp = opponents.find(o => o.id === selectedMatch.opponentId)?.name || 'Rival';
            text += `*⚽ DETALLE DE FECHA: vs ${opp}*\n`;
            text += `📅 ${selectedMatch.date}\n`;
            text += `🏆 Resultado: *${perMatchStats?.goalScorers.reduce((acc, p) => acc + p.totalGoals, 0) || 0} - ${selectedMatch.opponentScore || 0}*\n\n`;
            
            if (perMatchStats?.matchRanking.length) {
                text += `*⭐ FIGURAS DEL PARTIDO:*\n`;
                const rankingToShow = isAdmin ? perMatchStats.matchRanking : perMatchStats.matchRanking.slice(0, 5);
                rankingToShow.forEach((s, i) => {
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '-';
                    text += `${medal} *${s.player.nickname}*: ${s.matchAvg.toFixed(2)} ★\n`;
                });
                text += `\n`;
            }

            if (perMatchStats?.goalScorers.length) {
                text += `*⚽ GOLEADORES:*\n`;
                perMatchStats.goalScorers.forEach(g => {
                    text += `- ${g.player.nickname}: ${g.totalGoals} ⚽\n`;
                });
            }
            text += `\n_Calificaciones habilitadas en la Sala de Votación._`;
        }

        // Always include top goal scorers if not in match view
        if (view !== 'match') {
            text += `\n*⚽ TOP GOLEADORES*\n`;
            if (goalScorers.length > 0) {
                goalScorers.slice(0, 5).forEach((s, i) => {
                    const breakdown = [];
                    if (s.goalsPlay > 0) breakdown.push(`${s.goalsPlay} Jugada`);
                    if (s.goalsHeader > 0) breakdown.push(`${s.goalsHeader} Cabeza`);
                    if (s.goalsPenalty > 0) breakdown.push(`${s.goalsPenalty} Penal`);
                    if (s.goalsSetPiece > 0) breakdown.push(`${s.goalsSetPiece} T. Libre`);
                    
                    text += `${i + 1}. *${s.player.nickname}*: ${s.totalGoals} goles${breakdown.length > 0 ? ` (${breakdown.join(', ')})` : ''}\n`;
                });
            } else {
                text += `(Sin goles registrados en el período)\n`;
            }
        }

        if (disciplineRanking.length > 0) {
            text += `\n*🟥 DISCIPLINA*\n`;
            disciplineRanking.slice(0, 5).forEach((s, i) => {
                const cards = [];
                if (s.yellowCards > 0) cards.push(`${s.yellowCards} 🟨`);
                if (s.redCards > 0) cards.push(`${s.redCards} 🟥`);
                text += `${i + 1}. *${s.player.nickname}*: ${cards.join(' ')}\n`;
            });
        }

        text += `\n📱 *Usa la app, entrá al link:* \nhttps://primer-proyecto-a9290.web.app/`;

        window.location.href = `whatsapp://send?text=${encodeURIComponent(text)}`;
    };

    return (
        <div className="space-y-8 pb-12 animate-fadeIn">
            <div className="flex flex-col items-center gap-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Período de Análisis</p>
                <div className="flex flex-wrap justify-center bg-gray-200 dark:bg-gray-700 p-1 rounded-2xl gap-1 w-full max-w-2xl">
                    <button onClick={() => setTimeRange('WEEK')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${timeRange === 'WEEK' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>Semana</button>
                    <button onClick={() => setTimeRange('MONTH')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${timeRange === 'MONTH' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>Mes</button>
                    <button onClick={() => setTimeRange('ALL')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${timeRange === 'ALL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500'}`}>Todo</button>
                    
                    {tournaments.length > 0 && (
                        <select 
                            value={typeof timeRange === 'number' ? timeRange : ''} 
                            onChange={(e) => setTimeRange(e.target.value ? Number(e.target.value) : 'ALL')}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all outline-none ${typeof timeRange === 'number' ? 'bg-indigo-600 text-white' : 'bg-transparent text-gray-500'}`}
                        >
                            <option value="">🏆 Torneos...</option>
                            {tournaments.sort((a,b) => b.year - a.year).map(t => (
                                <option key={t.id} value={t.id} className="text-black">{t.name} '{t.year % 100}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>
            
            <div className="flex justify-center bg-white dark:bg-gray-800 p-1.5 rounded-3xl gap-2 shadow-xl border-2 border-indigo-50 dark:border-gray-700">
                <button onClick={() => setView('total')} className={`px-6 py-3 text-xs font-black rounded-2xl flex-1 transition-all uppercase italic tracking-tighter ${view === 'total' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'}`}>Ranking</button>
                <button onClick={() => setView('credits')} className={`px-6 py-3 text-xs font-black rounded-2xl flex-1 transition-all uppercase italic tracking-tighter ${view === 'credits' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400'}`}>💰 Fantasy</button>
                <button onClick={() => { setView('match'); setSelectedMatchId(null); }} className={`px-6 py-3 text-xs font-black rounded-2xl flex-1 transition-all uppercase italic tracking-tighter ${view === 'match' ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400'}`}>Por Fecha</button>
            </div>

            <div className="flex justify-center">
                <button 
                    onClick={handleShareStatsWA}
                    className="px-8 py-3 bg-green-600 text-white rounded-2xl font-black uppercase italic tracking-tighter shadow-lg active:scale-95 transition-all flex items-center gap-2"
                >
                    <span>📱</span> ENVIAR RESUMEN POR WHATSAPP
                </button>
            </div>

            {view === 'credits' && (
                <div className="animate-fadeIn">
                    <StatCard title="Ranking Créditos Fantasy" icon="💳" className="border-t-8 border-emerald-500 bg-emerald-50/10">
                        <div className="overflow-x-auto rounded-[2rem] border-2 dark:border-gray-700 bg-white dark:bg-gray-900">
                            <table className="w-full text-left">
                                <TableHeader columns={['#', 'Jugador', 'PJ', 'Suman', 'Arcade', 'TOTAL']} />
                                <tbody>
                                    {fantasyRanking.length > 0 ? fantasyRanking.map((stat, idx) => (
                                        <tr key={stat.player.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="p-4 font-black text-gray-300">#{idx + 1}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={stat.player.photoUrl} className="w-8 h-8 rounded-full object-cover border-2 border-emerald-100 shadow-sm" alt="" />
                                                    <span className="font-black text-gray-800 dark:text-white uppercase text-xs">{stat.player.nickname}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center font-bold">{stat.pj}</td>
                                            <td className="p-4 text-center text-emerald-600 font-bold">...</td>
                                            <td className="p-4 text-center text-blue-500 font-bold">{stat.player.gamePoints ? Math.round(stat.player.gamePoints / 10) : 0}</td>
                                            <td className="p-4 text-center font-black text-xl text-indigo-600">{stat.credits}</td>
                                        </tr>
                                    )) : <tr><td colSpan={6} className="p-20 text-center"><EmptyState message="No hay datos suficientes para este ranking." /></td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </StatCard>
                </div>
            )}

            {view === 'total' && (
                <div className="space-y-8 animate-fadeIn">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-gray-900 text-white p-8 rounded-[3rem] shadow-2xl flex flex-col justify-center items-center border-b-8 border-red-600 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">⚠️</div>
                            <p className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] mb-4">Penales en Contra</p>
                            <p className="text-8xl font-black text-red-500 drop-shadow-[0_5px_15px_rgba(239,68,68,0.4)] italic">{teamPenaltiesAgainst}</p>
                        </div>
                        <StatCard title="Podio de Votación" icon="⭐" className="lg:col-span-2 border-t-8 border-yellow-400">
                            {canViewRatings ? (
                                <div className="space-y-10">
                                    <Podium top3={ratingRanking.slice(0, 3)} onViewProfile={onViewProfile} />
                                    
                                    <div className="border-t dark:border-gray-700 pt-8">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Puntajes Generales</h4>
                                        <div className="overflow-x-auto rounded-2xl border dark:border-gray-700">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-gray-50 dark:bg-gray-900">
                                                    <tr>
                                                        <th className="p-3 font-black text-gray-500 uppercase">#</th>
                                                        <th className="p-3 font-black text-gray-500 uppercase">Jugador</th>
                                                        <th className="p-3 font-black text-gray-500 text-center uppercase">Votos</th>
                                                        <th className="p-3 font-black text-gray-500 text-center uppercase">Promedio</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y dark:divide-gray-800">
                                                    {ratingRanking.map((stat, idx) => (
                                                        <tr key={stat.player.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                            <td className="p-3 font-black text-gray-300">#{idx + 1}</td>
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-2">
                                                                    <img src={stat.player.photoUrl} className="w-6 h-6 rounded-full object-cover" alt="" />
                                                                    <span className="font-bold text-gray-700 dark:text-gray-200 uppercase">{stat.player.nickname}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-center font-bold text-gray-400">{stat.ratingCount}</td>
                                                            <td className="p-3 text-center">
                                                                <span className="font-black text-yellow-500">{stat.avgRating.toFixed(2)} ★</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            ) : <EmptyState message="Debes calificar para ver el podio." />}
                        </StatCard>
                    </div>
                    
                    <StatCard title="Vicios & Finanzas" icon="🍻" className="border-t-8 border-cyan-500 bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-indigo-950/10">
                        <div className="mb-10">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Distribución del Gasto (Cancha vs Birra)</h4>
                            <div className="h-12 bg-gray-200 dark:bg-gray-900 rounded-3xl overflow-hidden flex shadow-inner border-2 border-gray-100 dark:border-gray-800">
                                <div className="bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white italic" style={{ width: `${thirdHalfStats.courtPerc}%` }}>CANCHA {Math.round(thirdHalfStats.courtPerc)}%</div>
                                <div className="bg-yellow-400 flex items-center justify-center text-[10px] font-black text-indigo-950 italic" style={{ width: `${thirdHalfStats.thirdHalfPerc}%` }}>3ER TIEMPO {Math.round(thirdHalfStats.thirdHalfPerc)}%</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] text-center shadow-md border border-gray-100 dark:border-gray-700">
                                <p className="text-4xl mb-2">🍺</p>
                                <p className="text-3xl font-black text-yellow-600 italic tracking-tighter">{thirdHalfStats.totalBeerLitros} L</p>
                                <p className="text-[9px] font-black text-gray-400 uppercase mt-1 tracking-widest">Litros Bebidos</p>
                            </div>
                            <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] text-center shadow-md border border-gray-100 dark:border-gray-700">
                                <p className="text-4xl mb-2">💰</p>
                                <p className="text-3xl font-black text-emerald-600 italic tracking-tighter">{formatter.format(thirdHalfStats.totalSpentThirdHalf)}</p>
                                <p className="text-[9px] font-black text-gray-400 uppercase mt-1 tracking-widest">Inversión en Ocio</p>
                            </div>
                        </div>
                    </StatCard>

                    <StatCard title="Vallas e Invitados" icon="🥅" className="border-t-8 border-gray-800">
                        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-3xl text-center">
                            <p className="text-xs font-black text-gray-400 uppercase mb-2 tracking-widest">Vallas Invictas</p>
                            <p className="text-6xl font-black text-gray-800 dark:text-white">{filteredMatches.filter(m => m.opponentScore === 0).length}</p>
                        </div>
                    </StatCard>

                    <StatCard title="Ranking Goleadores" icon="⚽" className="border-t-8 border-green-500">
                        <div className="overflow-x-auto rounded-[2rem] border-2 dark:border-gray-700">
                            <table className="w-full text-left">
                                <TableHeader columns={['Jugador', 'Total', 'Jugada', 'Penal', 'Cabeza', 'T. Libre']} />
                                <tbody className="divide-y dark:divide-gray-800">
                                    {goalScorers.length > 0 ? goalScorers.map(stat => (
                                        <tr key={stat.player.id} onClick={() => onViewProfile(stat.player)} className="group cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={stat.player.photoUrl} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-110 transition-transform" alt="" />
                                                    <span className="font-black text-xs uppercase group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{stat.player.nickname}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="font-black text-3xl text-green-600 italic group-hover:scale-125 inline-block transition-transform decoration-dotted underline underline-offset-4">{stat.totalGoals}</span>
                                            </td>
                                            <td className="p-4 text-center font-bold text-gray-500">{stat.goalsPlay}</td>
                                            <td className="p-4 text-center font-bold text-gray-500">{stat.goalsPenalty}</td>
                                            <td className="p-4 text-center font-bold text-gray-500">{stat.goalsHeader}</td>
                                            <td className="p-4 text-center font-bold text-gray-500">{stat.goalsSetPiece}</td>
                                        </tr>
                                    )) : <tr><td colSpan={6} className="p-10 text-center italic text-gray-400">No hay goles en este rango.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </StatCard>

                    <StatCard title="Disciplina" icon="🟥" className="border-t-8 border-red-600">
                        <div className="overflow-x-auto rounded-[2rem] border-2 dark:border-gray-700">
                            <table className="w-full text-left">
                                <TableHeader columns={['Jugador', 'Amarillas', 'Rojas']} />
                                <tbody className="divide-y dark:divide-gray-800">
                                    {disciplineRanking.length > 0 ? disciplineRanking.map(stat => (
                                        <tr key={stat.player.id} onClick={() => onViewProfile(stat.player)} className="group cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={stat.player.photoUrl} className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-110 transition-transform" alt="" />
                                                    <span className="font-black text-xs uppercase group-hover:text-red-600 transition-colors">{stat.player.nickname}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-3 h-5 bg-yellow-400 rounded-sm shadow-sm"></div>
                                                    <span className="font-black text-xl text-gray-700 dark:text-gray-200">{stat.yellowCards}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-3 h-5 bg-red-600 rounded-sm shadow-sm"></div>
                                                    <span className="font-black text-xl text-gray-700 dark:text-gray-200">{stat.redCards}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : <tr><td colSpan={3} className="p-10 text-center italic text-gray-400">Nadie ha recibido tarjetas en este rango.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </StatCard>
                </div>
            )}

            {view === 'match' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="max-w-xl mx-auto">
                        <select 
                            value={selectedMatchId || ''} 
                            onChange={(e) => setSelectedMatchId(e.target.value ? Number(e.target.value) : null)} 
                            className="w-full p-5 bg-white dark:bg-gray-800 border-4 border-indigo-100 dark:border-gray-700 rounded-[2rem] shadow-2xl font-black uppercase italic tracking-tighter outline-none focus:border-indigo-500 transition-all text-gray-800 dark:text-white"
                        >
                            <option value="">-- Elige una fecha --</option>
                            {finishedMatches.map(match => (
                                <option key={match.id} value={match.id} className="text-black">
                                    {match.date.split(',')[0]} - vs {opponents.find(o => o.id === match.opponentId)?.name || 'Rival'}
                                </option>
                            ))}
                        </select>
                    </div>

                    {!selectedMatch && <EmptyState message="Selecciona un partido del historial para ver el detalle." />}
                    
                    {selectedMatch && perMatchStats && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-zoomIn max-w-6xl mx-auto">
                            <StatCard title="Figuras del Partido" icon="⭐">
                                <div className="space-y-3">
                                    {(perMatchStats.matchRanking.length > 0) ? (
                                        (isAdmin ? perMatchStats.matchRanking : perMatchStats.matchRanking.slice(0, 5)).map((p, i) => (
                                            <div key={p.player.id} className="flex justify-between items-center bg-white dark:bg-gray-900 p-3 rounded-2xl border-2 border-indigo-50 dark:border-gray-700 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-black text-gray-300 w-4">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                                                    <img src={p.player.photoUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                                                    <span className="font-black uppercase text-[10px]">{p.player.nickname}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-yellow-500 font-black text-sm">{p.matchAvg.toFixed(2)} ★</span>
                                                    {isAdmin && <span className="text-[8px] text-gray-400">{p.matchVotes} votos</span>}
                                                </div>
                                            </div>
                                        ))
                                    ) : <EmptyState message="Sin votos aún." />}
                                </div>
                            </StatCard>

                            <StatCard title="Goleadores" icon="⚽">
                                <div className="space-y-3">
                                    {perMatchStats.goalScorers.length > 0 ? perMatchStats.goalScorers.map(p => (
                                        <div key={p.player.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-3">
                                                <img src={p.player.photoUrl} className="w-10 h-10 rounded-full object-cover" alt="" />
                                                <span className="font-black uppercase text-xs">{p.player.nickname}</span>
                                            </div>
                                            <span className="bg-green-600 text-white px-4 py-1 rounded-full font-black italic tracking-tighter">⚽ {p.totalGoals}</span>
                                        </div>
                                    )) : <EmptyState message="Partido sin goles propios." />}
                                </div>
                            </StatCard>
                            
                            <StatCard title="Resumen" icon="📊">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-gray-400 uppercase">Resultado</span>
                                        <span className="font-black text-indigo-600 uppercase">
                                            {perMatchStats?.goalScorers.reduce((acc, p) => acc + p.totalGoals, 0) || 0} - {selectedMatch.opponentScore || 0}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-gray-400 uppercase">Recaudación</span>
                                        <span className="font-black text-emerald-600">{formatter.format(selectedMatch.playerStatuses.reduce((acc, ps) => acc + (ps.amountPaid || 0), 0))}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold text-gray-400 uppercase">Votación</span>
                                        <span className={`font-black uppercase ${selectedMatch.ratingStatus === 'OPEN' ? 'text-green-500' : 'text-red-500'}`}>{selectedMatch.ratingStatus === 'OPEN' ? 'Abierta' : 'Cerrada'}</span>
                                    </div>
                                </div>
                            </StatCard>
                        </div>
                    )}

                    {selectedMatch && isAdmin && (
                        <div className="mt-8 max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-[2rem] p-8 shadow-xl border-2 border-indigo-50 dark:border-gray-700">
                             <h3 className="text-xl font-black text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2 italic uppercase tracking-tighter">
                                <span>👮</span> Detalle de Votación (Admin)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedMatch.playerStatuses
                                    .filter(ps => ps.attendanceStatus === 'CONFIRMED')
                                    .map(ps => {
                                        const p = stats.find(s => s.player.id === ps.playerId)?.player;
                                        if (!p) return null;
                                        const raterVotes = selectedMatch.ratings?.[p.id] || {};
                                        const hasVoted = selectedMatch.finishedVoters?.includes(p.id);

                                        return (
                                            <div key={p.id} className="border-2 dark:border-gray-700 rounded-2xl overflow-hidden">
                                                <div className="bg-gray-50 dark:bg-gray-900 p-3 flex justify-between items-center border-b dark:border-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        <img src={p.photoUrl} className="w-8 h-8 rounded-full object-cover" alt="" />
                                                        <span className="font-black text-[10px] uppercase truncate w-24">{p.nickname}</span>
                                                    </div>
                                                    <span className={`text-[9px] font-black px-2 py-1 rounded-full ${hasVoted ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {hasVoted ? 'VOTÓ' : 'PENDIENTE'}
                                                    </span>
                                                </div>
                                                <div className="p-3 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                                                    {Object.entries(raterVotes).length > 0 ? (
                                                        Object.entries(raterVotes).map(([targetId, rating]) => {
                                                            const target = stats.find(s => s.player.id === Number(targetId))?.player;
                                                            return (
                                                                <div key={targetId} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-xl border dark:border-gray-800">
                                                                    <div className="flex flex-col overflow-hidden">
                                                                        <span className="text-[9px] font-bold truncate w-14">{target?.nickname || '---'}</span>
                                                                        <span className="text-[10px] text-yellow-500 font-black">{rating} ★</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : <p className="col-span-2 text-center text-[10px] text-gray-400 italic py-2">Sin votos</p>}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};