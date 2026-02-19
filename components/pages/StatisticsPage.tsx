

import React, { useMemo, useState } from 'react';
import type { PlayerStats, Player, Match, Opponent, ThirdHalfItem } from '../../types.ts';
import { AttendanceStatus, PlayerRole } from '../../types.ts';
import { useToast } from '../../hooks/useToast.ts';


interface StatisticsPageProps {
    stats: PlayerStats[];
    canViewRatings: boolean;
    onViewProfile: (player: Player) => void;
    teamPenaltiesAgainst: number;
    matches?: Match[];
    currentUser: Player;
    opponents: Opponent[];
    isSuperAdmin?: boolean; // New prop
    isAdmin?: boolean;
    onPardonPlayer?: (matchId: number, playerId: number) => void; // New prop
}

const StatCard: React.FC<{ title: string; children: React.ReactNode, icon?: string, className?: string }> = ({ title, children, icon, className }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${className}`}>
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            {icon && <span className="text-2xl">{icon}</span>}
            {title}
        </h3>
        {children}
    </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <p className="text-center py-4 text-gray-500 dark:text-gray-400">{message}</p>
);

const TableHeader: React.FC<{ columns: string[] }> = ({ columns }) => (
    <thead className="bg-gray-100 dark:bg-gray-700">
        <tr>
            {columns.map((col, i) => (
                <th key={i} className={`p-3 text-sm font-semibold tracking-wide ${i === 0 ? 'text-left' : 'text-center'}`}>{col}</th>
            ))}
        </tr>
    </thead>
);

const Podium: React.FC<{ top3: PlayerStats[] }> = ({ top3 }) => {
    if (top3.length === 0) return <EmptyState message="Votaciones pendientes." />;

    const [first, second, third] = top3;

    const PodiumItem = ({ stat, position, color, height }: { stat: PlayerStats | undefined, position: number, color: string, height: string }) => {
        if (!stat) return <div className="flex-1"></div>;
        return (
            <div className="flex flex-col items-center justify-end flex-1">
                 <div className="relative mb-2">
                    <img src={stat.player.photoUrl} alt={stat.player.nickname} className={`w-14 h-14 rounded-full border-4 ${color} object-cover`} />
                    <div className={`absolute -top-3 -right-3 w-7 h-7 rounded-full ${color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                        {position}
                    </div>
                </div>
                <p className="font-bold text-sm text-center truncate w-full">{stat.player.nickname}</p>
                <p className="text-xs font-bold text-yellow-600 mb-1">{stat.avgRating.toFixed(2)} ★</p>
                <div className={`w-full ${color} rounded-t-lg opacity-80`} style={{ height }}></div>
            </div>
        );
    }

    return (
        <div className="flex items-end justify-center h-48 gap-2 mb-6 px-4">
            <PodiumItem stat={second} position={2} color="bg-gray-400 border-gray-400" height="40%" />
            <PodiumItem stat={first} position={1} color="bg-yellow-400 border-yellow-400" height="60%" />
            <PodiumItem stat={third} position={3} color="bg-orange-400 border-orange-400" height="30%" />
        </div>
    );
};

const PRESET_ITEM_EMOJIS: {[key: string]: string} = { beer: '🍺', fernet: '🍷', pizza: '🍕', asado: '🥩', ice: '🧊', soda: '🥤', chips: '🍟', other: '🛒' };

export const StatisticsPage: React.FC<StatisticsPageProps> = ({ stats, canViewRatings, onViewProfile, teamPenaltiesAgainst, matches = [], currentUser, opponents, isAdmin, onPardonPlayer }) => {
    const toast = useToast();
    const [view, setView] = useState<'total' | 'match' | 'credits'>('total');
    const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

    const finishedMatches = useMemo(() => 
        matches.filter(m => m.status === 'FINALIZADO').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [matches]);
    
    const selectedMatch = useMemo(() => 
        selectedMatchId ? finishedMatches.find(m => m.id === selectedMatchId) : null,
    [selectedMatchId, finishedMatches]);

    const perMatchStats = useMemo(() => {
        if (!selectedMatch) return null;

        const confirmedPlayers = selectedMatch.playerStatuses
            .filter(ps => ps.attendanceStatus === 'CONFIRMED')
            .map(ps => {
                const player = stats.find(s => s.player.id === ps.playerId)?.player;
                if (!player) return null;
                const totalGoals = (ps.goalsPlay || 0) + (ps.goalsPenalty || 0) + (ps.goalsHeader || 0) + (ps.goalsSetPiece || 0);
                return { player, ...ps, totalGoals };
            })
            .filter((p): p is NonNullable<typeof p> => p !== null);

        const goalScorers = confirmedPlayers
            .filter(p => p.totalGoals > 0)
            .sort((a, b) => b.totalGoals - a.totalGoals);

        const discipline = confirmedPlayers
            .filter(p => (p.yellowCards || 0) > 0 || p.redCard)
            .sort((a, b) => ((b.redCard ? 2 : 0) + (b.yellowCards || 0)) - ((a.redCard ? 2 : 0) + (a.yellowCards || 0)));

        return { goalScorers, discipline };
    }, [selectedMatch, stats]);

    // Fantasy Credits Calculation
    const fantasyRanking = useMemo(() => {
        return stats.map(stat => {
            let credits = 0;
            // Base por Asistencia (PJ * 2)
            credits += (stat.pj * 2);
            
            // Goles
            credits += (stat.goalsPlay * 3);
            credits += (stat.goalsHeader * 5); // +5 extra for headers
            credits += (stat.goalsPenalty * 3); // +3 penal
            credits += (stat.goalsSetPiece * 4); // +4 free kick
            credits += (stat.assists * 2);

            // Discipline (Negatives)
            credits -= (stat.yellowCards * 2);
            credits -= (stat.redCards * 5);
            credits -= (stat.ownGoals * 5);
            credits -= (stat.penaltiesMissed * 3);
            
            // Bloopers & Errors
            credits -= (stat.badThrowIns * 1);
            credits -= (stat.badFreeKicks * 1);
            credits -= (stat.majorErrors * 2);

            // Arcade / Game Points (New)
            if (stat.player.gamePoints) {
                // Divides by 10 so arcade points don't overpower football points immediately
                // e.g., 100 arcade points = 10 fantasy credits
                credits += Math.round(stat.player.gamePoints / 10);
            }

            // Clean Sheet Bonus (Arquero/Defensa)
            // Need to iterate matches to check clean sheets
            finishedMatches.forEach(m => {
                const ps = m.playerStatuses.find(p => p.playerId === stat.player.id && p.attendanceStatus === AttendanceStatus.CONFIRMED);
                if (ps && m.opponentScore === 0) {
                    if (stat.player.role === PlayerRole.ARQUERO || 
                        stat.player.role === PlayerRole.DEFENSOR_CENTRAL || 
                        stat.player.role.includes('Defensa') || 
                        stat.player.role.includes('Lateral')) {
                        credits += 5; 
                    }
                }
            });

            // Star Rating Bonus (1st, 2nd, 3rd) per match
            finishedMatches.forEach(m => {
                const ps = m.playerStatuses.find(p => p.playerId === stat.player.id && p.attendanceStatus === AttendanceStatus.CONFIRMED);
                if (ps && m.ratings) {
                    // Calculate ratings for this match
                    const matchRatings: {id: number, avg: number}[] = [];
                    m.playerStatuses.forEach(p => {
                        let sum = 0, count = 0;
                        if(m.ratings) Object.values(m.ratings).forEach(v => { if(v[p.playerId]) { sum += v[p.playerId]; count++; }});
                        if(count > 0) matchRatings.push({ id: p.playerId, avg: sum/count });
                    });
                    
                    // Sort descending
                    matchRatings.sort((a,b) => b.avg - a.avg);
                    
                    // Award points
                    if (matchRatings[0]?.id === stat.player.id) credits += 5; // 1st
                    else if (matchRatings[1]?.id === stat.player.id) credits += 3; // 2nd
                    else if (matchRatings[2]?.id === stat.player.id) credits += 1; // 3rd
                }
            });

            return { ...stat, credits };
        }).sort((a, b) => b.credits - a.credits);
    }, [stats, finishedMatches]);


    // Total Stats calculations
    const goalScorers = [...stats].filter(s => s.totalGoals > 0).sort((a, b) => b.totalGoals - a.totalGoals);
    const disciplineRanking = [...stats].filter(s => s.yellowCards > 0 || s.redCards > 0).sort((a, b) => (b.redCards * 2 + b.yellowCards) - (a.redCards * 2 + a.yellowCards));
    const recordRanking = [...stats].filter(s => s.pj > 0).sort((a, b) => b.pg - a.pg || (b.pg + b.pe) - (a.pg + a.pe));
    const ratingRanking = canViewRatings ? [...stats].filter(s => s.avgRating > 0).sort((a, b) => b.avgRating - a.avgRating) : [];
    const podium = ratingRanking.slice(0, 3);
    const restOfHallOfFame = ratingRanking.slice(3);
    const laundryPending = [...stats].sort((a, b) => a.matchesWashed - b.matchesWashed || a.player.nickname.localeCompare(b.player.nickname));
    
    // Bloopers Ranking - Filter only those who have any negative stat
    const bloopersRanking = [...stats].filter(s => 
        (s.ownGoals > 0 || s.penaltiesMissed > 0 || s.badThrowIns > 0 || s.badFreeKicks > 0 || s.majorErrors > 0)
    ).sort((a, b) => {
        const totalA = a.ownGoals + a.penaltiesMissed + a.badThrowIns + a.badFreeKicks + a.majorErrors;
        const totalB = b.ownGoals + b.penaltiesMissed + b.badThrowIns + b.badFreeKicks + b.majorErrors;
        return totalB - totalA;
    });

    const thirdHalfStats = useMemo(() => {
        let totalBeerLitros = 0;
        let totalSpentThirdHalf = 0;
        let totalSpentCourt = 0;
        const itemsMap = new Map<string, {name: string, qty: number, emoji: string}>();
        matches.filter(m => m.status === 'FINALIZADO').forEach(m => {
            totalSpentCourt += m.courtFee;
            if (m.thirdHalf) {
                totalSpentThirdHalf += m.thirdHalf.totalSpent;
                m.thirdHalf.items.forEach((item: ThirdHalfItem) => { // Cast item to ThirdHalfItem
                    if (item.id === 'beer') totalBeerLitros += item.quantity;
                    let emoji = PRESET_ITEM_EMOJIS[item.id] || '🛒';
                    const current = itemsMap.get(item.id) || { name: item.name, qty: 0, emoji };
                    itemsMap.set(item.id, { name: item.name, qty: current.qty + item.quantity, emoji: current.emoji });
                });
            }
        });
        const topItems = [...itemsMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 3);
        const grandTotal = totalSpentCourt + totalSpentThirdHalf;
        return { totalBeerLitros, totalSpentThirdHalf, totalSpentCourt, topItems, courtPerc: grandTotal > 0 ? (totalSpentCourt / grandTotal) * 100 : 50, thirdHalfPerc: grandTotal > 0 ? (totalSpentThirdHalf / grandTotal) * 100 : 50 };
    }, [matches]);

    const isUserPenalized = useMemo(() => {
        const finished = [...matches].filter(m => m.status === 'FINALIZADO').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (finished.length === 0) return false;
        
        // Find last played match
        const lastPlayed = finished.find(m => m.playerStatuses.some(ps => ps.playerId === currentUser.id && ps.attendanceStatus === AttendanceStatus.CONFIRMED));
        
        if (!lastPlayed) return false;

        const voted = lastPlayed.finishedVoters?.includes(currentUser.id);
        const pardoned = lastPlayed.pardonedVoters?.includes(currentUser.id);

        return !voted && !pardoned;
    }, [matches, currentUser]);

    // Admin Pardon Logic
    const penalizedPlayers = useMemo(() => {
        if (!isAdmin) return [];
        const penalties: { matchId: number, matchDate: string, player: Player }[] = [];
        
        // For last 3 finished matches only to keep it relevant
        const recentMatches = finishedMatches.slice(0, 3);
        
        recentMatches.forEach(m => {
            m.playerStatuses.forEach(ps => {
                if (ps.attendanceStatus === AttendanceStatus.CONFIRMED) {
                    const voted = m.finishedVoters?.includes(ps.playerId);
                    const pardoned = m.pardonedVoters?.includes(ps.playerId);
                    if (!voted && !pardoned) {
                        const p = stats.find(s => s.player.id === ps.playerId)?.player;
                        if (p) penalties.push({ matchId: m.id, matchDate: m.date, player: p });
                    }
                }
            });
        });
        return penalties;
    }, [finishedMatches, isAdmin, stats]);


    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

    const handleShareStats = async () => {
        const topGoalScorers = goalScorers.slice(0, 3).map((s, i) => `${i + 1}. ${s.player.nickname} (${s.totalGoals})`).join('\n');
        const topRated = ratingRanking.slice(0, 3).map((s, i) => `${i + 1}. ${s.player.nickname} (${s.avgRating.toFixed(1)} ★)`).join('\n');
        const shareText = `*📊 Resumen Estadístico - PLAYERS LD 📊*\n\n*⚽ GOLEADORES:*\n${topGoalScorers || 'Sin datos'}\n\n*⭐ PODIO:*\n${canViewRatings ? (topRated || 'Sin datos') : 'Votaciones pendientes'}\n\n*🍻 3ER TIEMPO:*\nSe tomaron ${thirdHalfStats.totalBeerLitros} litros de cerveza este año.\n\n---\n¡Vamos equipo! 💪`.trim();
        try { await navigator.clipboard.writeText(shareText); toast.success('¡Resumen copiado! Abriendo WhatsApp...'); } catch (e) {}
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
    };
    

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">Estadísticas del Equipo</h2>
                <button onClick={handleShareStats} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                    Compartir Resumen
                </button>
            </div>
            
            <div className="flex justify-center bg-gray-200 dark:bg-gray-700 p-1 rounded-lg gap-1">
                <button onClick={() => setView('total')} className={`px-4 py-2 text-xs md:text-sm font-bold rounded-md flex-1 transition-all ${view === 'total' ? 'bg-white dark:bg-gray-800 shadow text-indigo-600' : 'text-gray-600 dark:text-gray-300'}`}>General</button>
                <button onClick={() => setView('credits')} className={`px-4 py-2 text-xs md:text-sm font-bold rounded-md flex-1 transition-all ${view === 'credits' ? 'bg-white dark:bg-gray-800 shadow text-green-600' : 'text-gray-600 dark:text-gray-300'}`}>💳 Créditos</button>
                <button onClick={() => { setView('match'); setSelectedMatchId(null); }} className={`px-4 py-2 text-xs md:text-sm font-bold rounded-md flex-1 transition-all ${view === 'match' ? 'bg-white dark:bg-gray-800 shadow text-indigo-600' : 'text-gray-600 dark:text-gray-300'}`}>Por Partido</button>
            </div>

            {view === 'credits' && (
                <div className="animate-fadeIn">
                    <StatCard title="Ranking de Créditos (Fantasy)" icon="💳" className="border-2 border-green-500 bg-green-50 dark:bg-green-900/10">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            <strong>Sistema de Puntos:</strong> <br/>
                            <span className="text-xs">
                            ✅ Asistencia: +2 | ⚽ Goles: +3 (Jugada), +5 (Cabeza), +4 (Tiro Libre), +3 (Penal) <br/>
                            🛡️ Valla Invicta (Def/Arq): +5 | ⭐ Top 3 Votación: +5, +3, +1 <br/>
                            🕹️ Arcade: +1 Crédito por cada 10 puntos en juegos.<br/>
                            ❌ Negativos: Tarjetas, Goles en contra, Penales errados, Bloopers.
                            </span>
                        </p>
                        <div className="overflow-x-auto rounded-lg shadow">
                            <table className="w-full text-left bg-white dark:bg-gray-800">
                                <TableHeader columns={['#', 'Jugador', 'PJ', 'Goles', '⭐ Bonus', '🕹️ Extra', 'TOTAL']} />
                                <tbody>
                                    {fantasyRanking.map((stat, idx) => (
                                        <tr key={stat.player.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b dark:border-gray-700">
                                            <td className="p-3 font-bold text-gray-500">{idx + 1}</td>
                                            <td className="p-3 font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                                <img src={stat.player.photoUrl} className="w-8 h-8 rounded-full object-cover" />
                                                {stat.player.nickname}
                                            </td>
                                            <td className="p-3 text-center">{stat.pj}</td>
                                            <td className="p-3 text-center">{stat.totalGoals}</td>
                                            <td className="p-3 text-center text-yellow-600 font-bold">
                                                {/* Calculate Stars Bonus for display just to show something cool */}
                                                {(stat.avgRating > 4) ? '🔥' : '-'}
                                            </td>
                                            <td className="p-3 text-center text-blue-500 font-bold">
                                                {stat.player.gamePoints ? Math.round(stat.player.gamePoints / 10) : '-'}
                                            </td>
                                            <td className="p-3 text-center font-black text-xl text-green-600">{stat.credits}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </StatCard>
                </div>
            )}

            {view === 'total' && (
            <div className="space-y-8 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 md:col-span-2 text-center bg-gray-800 text-white p-6 rounded-lg shadow-lg flex flex-col justify-center items-center"><p className="text-sm uppercase font-bold text-gray-400">Penales en Contra</p><p className="text-6xl font-black text-red-500">{teamPenaltiesAgainst}</p></div>
                    <StatCard title="🏆 Salón de la Fama (Votación)" icon="⭐" className="lg:col-span-2 md:col-span-2 relative overflow-hidden">
                        {canViewRatings && !isUserPenalized ? (<><Podium top3={podium} />{restOfHallOfFame.length > 0 && (<div className="mt-4 border-t pt-4 dark:border-gray-700"><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{restOfHallOfFame.map((stat, index) => (<div key={stat.player.id} onClick={() => onViewProfile(stat.player)} className="cursor-pointer flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded"><div className="flex items-center gap-2"><span className="font-bold text-gray-500">{index + 4}.</span><p>{stat.player.nickname}</p></div><p className="font-bold text-yellow-600 dark:text-yellow-400">{stat.avgRating.toFixed(2)} ★</p></div>))}</div></div>)}</>) : (<div className="flex flex-col items-center justify-center py-10 text-center">{isUserPenalized ? (<><div className="text-5xl mb-2">⛔</div><h4 className="font-bold text-red-600">Acceso Restringido</h4><p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xs">No votaste en el último partido que jugaste. Debes cumplir con la votación para ver el ranking.</p></>) : (<p className="text-yellow-700 dark:text-yellow-300">Completa tus votaciones pendientes para ver el Salón de la Fama.</p>)}</div>)}
                    </StatCard>
                </div>
                <StatCard title="Economía & Vicios" icon="🍻" className="bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-gray-900 border border-orange-200 dark:border-gray-700">
                    <div className="mb-6"><h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Fútbol vs. Joda (Gasto Total)</h4><div className="relative h-8 bg-gray-200 rounded-full overflow-hidden shadow-inner flex"><div className="h-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white transition-all duration-1000" style={{ width: `${thirdHalfStats.courtPerc}%` }}>{Math.round(thirdHalfStats.courtPerc)}%</div><div className="h-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white transition-all duration-1000" style={{ width: `${thirdHalfStats.thirdHalfPerc}%` }}>{Math.round(thirdHalfStats.thirdHalfPerc)}%</div></div><div className="flex justify-between text-xs mt-1 font-bold"><span className="text-blue-600">Cancha ({formatter.format(thirdHalfStats.totalSpentCourt)})</span><span className="text-orange-600">3er Tiempo ({formatter.format(thirdHalfStats.totalSpentThirdHalf)})</span></div></div>
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-center"><div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl"><p className="text-3xl">🍺</p><p className="text-2xl font-black text-yellow-700 dark:text-yellow-400 my-1">{thirdHalfStats.totalBeerLitros} L</p><p className="text-[10px] uppercase font-bold text-gray-500">Litros Bebidos</p></div><div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl text-left"><p className="text-xs uppercase font-bold text-gray-500 mb-2 border-b pb-1">Top Consumo</p>{thirdHalfStats.topItems.length > 0 ? (<ul className="space-y-1">{thirdHalfStats.topItems.map((item, idx) => (<li key={idx} className="text-sm flex justify-between"><span>{item.emoji} {item.name}</span><span className="font-bold">{item.qty}</span></li>))}</ul>) : (<p className="text-xs text-gray-400 italic">Sin datos aún</p>)}</div></div>
                </StatCard>
                <StatCard title="Tabla de Goleadores" icon="⚽"><div className="overflow-x-auto"><table className="w-full text-left"><TableHeader columns={['Jugador', 'Total', 'Jugada', 'Penal', 'Cabeza', 'T. Libre']} /><tbody>{goalScorers.length > 0 ? goalScorers.map(stat => (<tr key={stat.player.id} onClick={() => onViewProfile(stat.player)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"><td className="p-2"><p className="font-semibold">{stat.player.nickname}</p></td><td className="p-2 text-center font-bold text-lg">{stat.totalGoals}</td><td className="p-2 text-center">{stat.goalsPlay}</td><td className="p-2 text-center">{stat.goalsPenalty}</td><td className="p-2 text-center">{stat.goalsHeader}</td><td className="p-2 text-center">{stat.goalsSetPiece}</td></tr>)) : <tr><td colSpan={6}><EmptyState message="Aún no se han marcado goles." /></td></tr>}</tbody></table></div></StatCard>
                
                {/* BLOOPERS CARD */}
                <StatCard title="😅 Bloopers & Curiosidades" icon="🤦" className="border border-red-200 dark:border-red-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <TableHeader columns={['Jugador', '🥅 G.Contra', '❌ P.Errado', '🙌 Mal Lat.', '☁️ Mal TL', '🤦 Error']} />
                            <tbody>
                                {bloopersRanking.length > 0 ? bloopersRanking.map(stat => (
                                    <tr key={stat.player.id} onClick={() => onViewProfile(stat.player)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-2 font-semibold text-sm">{stat.player.nickname}</td>
                                        <td className="p-2 text-center text-red-600 font-bold bg-red-50 dark:bg-red-900/10">{stat.ownGoals > 0 ? stat.ownGoals : '-'}</td>
                                        <td className="p-2 text-center text-gray-600">{stat.penaltiesMissed > 0 ? stat.penaltiesMissed : '-'}</td>
                                        <td className="p-2 text-center text-gray-600">{stat.badThrowIns > 0 ? stat.badThrowIns : '-'}</td>
                                        <td className="p-2 text-center text-gray-600">{stat.badFreeKicks > 0 ? stat.badFreeKicks : '-'}</td>
                                        <td className="p-2 text-center text-gray-600">{stat.majorErrors > 0 ? stat.majorErrors : '-'}</td>
                                    </tr>
                                )) : <tr><td colSpan={6}><EmptyState message="¡Increíble! Nadie ha cometido errores aún." /></td></tr>}
                            </tbody>
                        </table>
                    </div>
                </StatCard>

                <StatCard title="📂 Otros Datos" icon="📋"><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div><h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 border-b pb-1">👕 Pendientes de Lavar</h4><p className="text-xs text-gray-500 mb-2">Ordenados por prioridad (menos veces lavó).</p><div className="max-h-60 overflow-y-auto space-y-2 pr-2">{laundryPending.map((stat, i) => (<div key={stat.player.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded"><div className="flex items-center gap-2"><span className="text-xs font-mono text-gray-400">{i + 1}</span><span className={`font-medium ${stat.matchesWashed === 0 ? 'text-red-600 dark:text-red-400' : ''}`}>{stat.player.nickname}</span></div><span className="text-xs text-gray-500">{stat.matchesWashed} veces lavó</span></div>))}</div></div><div><h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 border-b pb-1">🧼 Historial de Lavado</h4><div className="text-sm text-gray-500 italic text-center p-4">Para ver el detalle completo, revisa el Fixture o las tarjetas de partidos finalizados.</div><div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-xs text-blue-800 dark:text-blue-200"><strong>Tip:</strong> Al finalizar un partido, el admin asigna quién lava. El sistema sugerirá al siguiente en la lista.</div></div></div></StatCard>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8"><StatCard title="Récord Personal" icon="📈"><div className="overflow-x-auto"><table className="w-full text-left"><TableHeader columns={['Jugador', 'PJ', 'PG', 'PE', 'PP']} /><tbody>{recordRanking.length > 0 ? recordRanking.map(stat => (<tr key={stat.player.id} onClick={() => onViewProfile(stat.player)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"><td className="p-2 font-semibold">{stat.player.nickname}</td><td className="p-2 text-center font-bold">{stat.pj}</td><td className="p-2 text-center text-green-600">{stat.pg}</td><td className="p-2 text-center text-gray-500">{stat.pe}</td><td className="p-2 text-center text-red-600">{stat.pp}</td></tr>)) : <tr><td colSpan={5}><EmptyState message="No hay partidos finalizados." /></td></tr>}</tbody></table></div></StatCard><StatCard title="Disciplina" icon="🟥"><div className="overflow-x-auto"><table className="w-full text-left"><TableHeader columns={['Jugador', 'Amarillas', 'Rojas']} /><tbody>{disciplineRanking.length > 0 ? disciplineRanking.map(stat => (<tr key={stat.player.id} onClick={() => onViewProfile(stat.player)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"><td className="p-2 font-semibold">{stat.player.nickname}</td><td className="p-2 text-center"><span className="inline-block w-5 h-5 bg-yellow-400 mr-1"></span>{stat.yellowCards}</td><td className="p-2 text-center"><span className="inline-block w-5 h-5 bg-red-600 mr-1"></span>{stat.redCards}</td></tr>)) : <tr><td colSpan={3}><EmptyState message="Nadie ha recibido tarjetas." /></td></tr>}</tbody></table></div></StatCard></div>
                
                {/* ADMIN PARDON PANEL */}
                {isAdmin && penalizedPlayers.length > 0 && (
                    <StatCard title="👮 Panel de Indultos (Admin)" className="border-2 border-red-500 bg-red-50 dark:bg-red-900/10 mt-8">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Los siguientes jugadores no votaron y tienen restringido el acceso a las estadísticas.
                            Puedes "Indultarlos" (perdonarlos) para que vuelvan a ver el ranking.
                        </p>
                        <div className="space-y-3">
                            {penalizedPlayers.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                                    <div>
                                        <p className="font-bold text-gray-800 dark:text-gray-200">{item.player.nickname}</p>
                                        <p className="text-xs text-red-500">Deuda de voto: {item.matchDate}</p>
                                    </div>
                                    <button 
                                        onClick={() => onPardonPlayer && onPardonPlayer(item.matchId, item.player.id)}
                                        className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 shadow"
                                    >
                                        INDULTAR
                                    </button>
                                </div>
                            ))}
                        </div>
                    </StatCard>
                )}
            </div>
            )}

            {view === 'match' && (
            <div className="space-y-6 animate-fadeIn">
                <select value={selectedMatchId || ''} onChange={(e) => setSelectedMatchId(e.target.value ? Number(e.target.value) : null)} className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
                    <option value="">-- Selecciona un partido finalizado --</option>
                    {finishedMatches.map(match => (<option key={match.id} value={match.id}>{match.date} - vs {opponents.find(o => o.id === match.opponentId)?.name || 'Rival'}</option>))}
                </select>
                
                {!selectedMatch && <EmptyState message="Elige un partido de la lista para ver sus detalles." />}

                {selectedMatch && perMatchStats && (
                    <div className="space-y-6 mt-6">
                        <StatCard title="🍻 Consumo del Partido" icon="🍻">
                            {selectedMatch.thirdHalf && selectedMatch.thirdHalf.totalSpent > 0 ? (
                            <div className="space-y-3">
                                <p className="text-3xl font-black text-center text-green-600 dark:text-green-400">{formatter.format(selectedMatch.thirdHalf.totalSpent)}</p>
                                <ul className="space-y-2 pt-4 border-t dark:border-gray-700">
                                    {selectedMatch.thirdHalf.items.map((item: ThirdHalfItem) => (<li key={item.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md"><span>{PRESET_ITEM_EMOJIS[item.id] || '🛒'} {item.name}</span><span className="font-bold">{item.quantity}</span></li>))}
                                </ul>
                            </div>
                            ) : ( <EmptyState message="No se cargó consumo para este partido." /> )}
                        </StatCard>
                        <StatCard title="Goleadores del Partido" icon="⚽">
                             <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                <TableHeader columns={['Jugador', 'Total', 'Jugada', 'Penal', 'Cabeza', 'T. Libre']} />
                                <tbody>
                                    {perMatchStats.goalScorers.length > 0 ? perMatchStats.goalScorers.map(stat => (
                                    <tr key={stat.player.id} onClick={() => onViewProfile(stat.player)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-2 font-semibold">{stat.player.nickname}</td>
                                        <td className="p-2 text-center font-bold text-lg">{stat.totalGoals}</td>
                                        <td className="p-2 text-center">{stat.goalsPlay || 0}</td>
                                        <td className="p-2 text-center">{stat.goalsPenalty || 0}</td>
                                        <td className="p-2 text-center">{stat.goalsHeader || 0}</td>
                                        <td className="p-2 text-center">{stat.goalsSetPiece || 0}</td>
                                    </tr>
                                    )) : <tr><td colSpan={6}><EmptyState message="No hubo goles en este partido." /></td></tr>}
                                </tbody>
                                </table>
                            </div>
                        </StatCard>
                        <StatCard title="Disciplina del Partido" icon="🟥">
                             <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                <TableHeader columns={['Jugador', 'Amarillas', 'Rojas']} />
                                <tbody>
                                    {perMatchStats.discipline.length > 0 ? perMatchStats.discipline.map(stat => (
                                    <tr key={stat.player.id} onClick={() => onViewProfile(stat.player)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-2 font-semibold">{stat.player.nickname}</td>
                                        <td className="p-2 text-center"><span className="inline-block w-5 h-5 bg-yellow-400 mr-1"></span>{stat.yellowCards || 0}</td>
                                        <td className="p-2 text-center"><span className="inline-block w-5 h-5 bg-red-600 mr-1"></span>{stat.redCard ? 1 : 0}</td>
                                    </tr>
                                    )) : <tr><td colSpan={3}><EmptyState message="Partido limpio, sin tarjetas." /></td></tr>}
                                </tbody>
                                </table>
                            </div>
                        </StatCard>
                    </div>
                )}
            </div>
            )}
        </div>
    );
};