
import React, { useMemo } from 'react';
import type { PlayerStats, Player, Match } from '../../types.ts';
import { AttendanceStatus } from '../../types.ts';
import { useToast } from '../../hooks/useToast.ts';


interface StatisticsPageProps {
    stats: PlayerStats[];
    canViewRatings: boolean;
    onViewProfile: (player: Player) => void;
    teamPenaltiesAgainst: number;
    matches?: Match[]; // Passed from App.tsx to calculate laundry history
    currentUser: Player; // Needed for penalty check
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


export const StatisticsPage: React.FC<StatisticsPageProps> = ({ stats, canViewRatings, onViewProfile, teamPenaltiesAgainst, matches = [], currentUser }) => {
    const toast = useToast();

    // Stats calculations
    const goalScorers = [...stats]
        .filter(s => s.totalGoals > 0)
        .sort((a, b) => b.totalGoals - a.totalGoals);

    const disciplineRanking = [...stats]
        .filter(s => s.yellowCards > 0 || s.redCards > 0)
        .sort((a, b) => (b.redCards * 2 + b.yellowCards) - (a.redCards * 2 + a.yellowCards));
    
    const recordRanking = [...stats]
        .filter(s => s.pj > 0)
        .sort((a, b) => b.pg - a.pg || (b.pg + b.pe) - (a.pg + a.pe));

    const ratingRanking = canViewRatings ? [...stats]
        .filter(s => s.avgRating > 0)
        .sort((a, b) => b.avgRating - a.avgRating) : [];

    // Hall of Fame Split
    const podium = ratingRanking.slice(0, 3);
    const restOfHallOfFame = ratingRanking.slice(3);

    // Laundry Logic
    const laundryPending = [...stats]
        .sort((a, b) => {
            if (a.matchesWashed !== b.matchesWashed) return a.matchesWashed - b.matchesWashed;
            return a.player.nickname.localeCompare(b.player.nickname);
        });

    // Third Half Stats Logic
    const thirdHalfStats = useMemo(() => {
        let totalBeerLitros = 0;
        let totalSpentThirdHalf = 0;
        let totalSpentCourt = 0;
        const itemsMap = new Map<string, {name: string, qty: number, emoji: string}>();

        matches.filter(m => m.status === 'FINALIZADO').forEach(m => {
            totalSpentCourt += m.courtFee;
            if (m.thirdHalf) {
                totalSpentThirdHalf += m.thirdHalf.totalSpent;
                m.thirdHalf.items.forEach(item => {
                    if (item.id === 'beer') totalBeerLitros += item.quantity;
                    
                    // Encontrar el emoji original si es posible, sino default
                    let emoji = '🛒';
                    if (item.name.includes('Cerveza')) emoji = '🍺';
                    if (item.name.includes('Fernet')) emoji = '🍷';
                    if (item.name.includes('Pizza')) emoji = '🍕';
                    if (item.name.includes('Asado')) emoji = '🥩';
                    if (item.name.includes('Hielo')) emoji = '🧊';

                    const current = itemsMap.get(item.id) || { name: item.name, qty: 0, emoji };
                    itemsMap.set(item.id, { name: item.name, qty: current.qty + item.quantity, emoji: current.emoji });
                });
            }
        });

        const topItems = [...itemsMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 3);
        const grandTotal = totalSpentCourt + totalSpentThirdHalf;
        const courtPerc = grandTotal > 0 ? (totalSpentCourt / grandTotal) * 100 : 50;
        const thirdHalfPerc = grandTotal > 0 ? (totalSpentThirdHalf / grandTotal) * 100 : 0;

        return { totalBeerLitros, totalSpentThirdHalf, totalSpentCourt, topItems, courtPerc, thirdHalfPerc };
    }, [matches]);

    // Check penalty for current user to hide/blur podium
    const isUserPenalized = useMemo(() => {
        // Just a quick check for the latest match penalty to enforce the rules visually on the global stats
        const finishedMatches = [...matches]
            .filter(m => m.status === 'FINALIZADO')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        if (finishedMatches.length === 0) return false;
        
        // Find the last match user played
        const lastPlayedMatch = finishedMatches.find(m => m.playerStatuses.some(ps => ps.playerId === currentUser.id && ps.attendanceStatus === AttendanceStatus.CONFIRMED));
        
        if (!lastPlayedMatch) return false;

        // If played last match and didn't vote -> Penalized
        if (!lastPlayedMatch.finishedVoters?.includes(currentUser.id)) return true;

        return false;
    }, [matches, currentUser]);


    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

    const handleShareStats = async () => {
        const topGoalScorers = goalScorers.slice(0, 3).map((s, i) => `${i + 1}. ${s.player.nickname} (${s.totalGoals})`).join('\n');
        const topRated = ratingRanking.slice(0, 3).map((s, i) => `${i + 1}. ${s.player.nickname} (${s.avgRating.toFixed(1)} ★)`).join('\n');
        
        const shareText = `
*📊 Resumen Estadístico - PLAYERS LD 📊*

*⚽ GOLEADORES:*
${topGoalScorers || 'Sin datos'}

*⭐ PODIO:*
${canViewRatings ? (topRated || 'Sin datos') : 'Votaciones pendientes'}

*🍻 3ER TIEMPO:*
Se tomaron ${thirdHalfStats.totalBeerLitros} litros de cerveza este año.

---
¡Vamos equipo! 💪`.trim();

        try {
            await navigator.clipboard.writeText(shareText);
            toast.success('¡Resumen copiado! Abriendo WhatsApp...');
        } catch (copyError) {
            console.error(copyError);
        }
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">Estadísticas del Equipo</h2>
                <button onClick={handleShareStats} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                    Compartir Resumen
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* Team Stats */}
                 <div className="lg:col-span-1 md:col-span-2 text-center bg-gray-800 text-white p-6 rounded-lg shadow-lg flex flex-col justify-center items-center">
                    <p className="text-sm uppercase font-bold text-gray-400">Penales en Contra</p>
                    <p className="text-6xl font-black text-red-500">{teamPenaltiesAgainst}</p>
                </div>

                {/* Hall of Fame */}
                 <StatCard title="🏆 Salón de la Fama" icon="⭐" className="lg:col-span-2 md:col-span-2 relative overflow-hidden">
                    {canViewRatings && !isUserPenalized ? (
                        <>
                            <Podium top3={podium} />
                            {restOfHallOfFame.length > 0 && (
                                <div className="mt-4 border-t pt-4 dark:border-gray-700">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {restOfHallOfFame.map((stat, index) => (
                                             <div key={stat.player.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-500">{index + 4}.</span>
                                                    <p>{stat.player.nickname}</p>
                                                </div>
                                                <p className="font-bold text-yellow-600 dark:text-yellow-400">{stat.avgRating.toFixed(2)} ★</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            {isUserPenalized ? (
                                <>
                                    <div className="text-5xl mb-2">⛔</div>
                                    <h4 className="font-bold text-red-600">Acceso Restringido</h4>
                                    <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
                                        No votaste en el último partido que jugaste. Debes cumplir con la votación para ver el ranking.
                                    </p>
                                </>
                            ) : (
                                <p className="text-yellow-700 dark:text-yellow-300">Completa tus votaciones pendientes para ver el Salón de la Fama.</p>
                            )}
                        </div>
                    )}
                 </StatCard>
            </div>

            {/* ECONOMIA Y VICIOS (3ER TIEMPO) MEJORADO */}
            <StatCard title="Economía & Vicios" icon="🍻" className="bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-gray-900 border border-orange-200 dark:border-gray-700">
                <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Fútbol vs. Joda (Gasto Total)</h4>
                    <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden shadow-inner flex">
                        <div className="h-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white transition-all duration-1000" style={{ width: `${thirdHalfStats.courtPerc}%` }}>
                            {Math.round(thirdHalfStats.courtPerc)}%
                        </div>
                        <div className="h-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white transition-all duration-1000" style={{ width: `${thirdHalfStats.thirdHalfPerc}%` }}>
                            {Math.round(thirdHalfStats.thirdHalfPerc)}%
                        </div>
                    </div>
                    <div className="flex justify-between text-xs mt-1 font-bold">
                        <span className="text-blue-600">Cancha ({formatter.format(thirdHalfStats.totalSpentCourt)})</span>
                        <span className="text-orange-600">3er Tiempo ({formatter.format(thirdHalfStats.totalSpentThirdHalf)})</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                        <p className="text-3xl">🍺</p>
                        <p className="text-2xl font-black text-yellow-700 dark:text-yellow-400 my-1">{thirdHalfStats.totalBeerLitros} L</p>
                        <p className="text-[10px] uppercase font-bold text-gray-500">Litros Bebidos</p>
                    </div>
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl text-left">
                        <p className="text-xs uppercase font-bold text-gray-500 mb-2 border-b pb-1">Top Consumo</p>
                        {thirdHalfStats.topItems.length > 0 ? (
                            <ul className="space-y-1">
                                {thirdHalfStats.topItems.map((item, idx) => (
                                    <li key={idx} className="text-sm flex justify-between">
                                        <span>{item.emoji} {item.name}</span>
                                        <span className="font-bold">{item.qty}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-xs text-gray-400 italic">Sin datos aún</p>
                        )}
                    </div>
                </div>
            </StatCard>

            <StatCard title="Tabla de Goleadores" icon="⚽">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <TableHeader columns={['Jugador', 'Total', 'Jugada', 'Penal', 'Cabeza', 'T. Libre']} />
                        <tbody>
                            {goalScorers.length > 0 ? goalScorers.map(stat => (
                                <tr key={stat.player.id} onClick={() => onViewProfile(stat.player)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="p-2">
                                        <p className="font-semibold">{stat.player.nickname}</p>
                                    </td>
                                    <td className="p-2 text-center font-bold text-lg">{stat.totalGoals}</td>
                                    <td className="p-2 text-center">{stat.goalsPlay}</td>
                                    <td className="p-2 text-center">{stat.goalsPenalty}</td>
                                    <td className="p-2 text-center">{stat.goalsHeader}</td>
                                    <td className="p-2 text-center">{stat.goalsSetPiece}</td>
                                </tr>
                            )) : <tr><td colSpan={6}><EmptyState message="Aún no se han marcado goles." /></td></tr>}
                        </tbody>
                    </table>
                </div>
            </StatCard>
            
            <StatCard title="📂 Otros Datos" icon="📋">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Laundry Pending */}
                    <div>
                        <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 border-b pb-1">👕 Pendientes de Lavar</h4>
                        <p className="text-xs text-gray-500 mb-2">Ordenados alfabéticamente. Prioridad a quienes nunca han lavado.</p>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                             {laundryPending.map((stat, i) => (
                                <div key={stat.player.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-gray-400">{i + 1}</span>
                                        <span className={`font-medium ${stat.matchesWashed === 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                                            {stat.player.nickname}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500">{stat.matchesWashed} veces lavó</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Simple Laundry History Table (Ideally populated with real match data if passed, currently showing counts implies history exists) */}
                    <div>
                        <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 border-b pb-1">🧼 Historial de Lavado</h4>
                        <div className="text-sm text-gray-500 italic text-center p-4">
                            Para ver el detalle completo por fecha, revisa el Fixture o las tarjetas de partidos finalizados.
                        </div>
                         <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-xs text-blue-800 dark:text-blue-200">
                            <strong>Tip:</strong> Al finalizar un partido, el administrador puede asignar quién se lleva las camisetas. El sistema sugerirá automáticamente al siguiente en la lista que haya asistido.
                        </div>
                    </div>
                </div>
            </StatCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <StatCard title="Récord Personal" icon="📈">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <TableHeader columns={['Jugador', 'PJ', 'PG', 'PE', 'PP']} />
                            <tbody>
                                {recordRanking.length > 0 ? recordRanking.map(stat => (
                                    <tr key={stat.player.id} onClick={() => onViewProfile(stat.player)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-2 font-semibold">{stat.player.nickname}</td>
                                        <td className="p-2 text-center font-bold">{stat.pj}</td>
                                        <td className="p-2 text-center text-green-600">{stat.pg}</td>
                                        <td className="p-2 text-center text-gray-500">{stat.pe}</td>
                                        <td className="p-2 text-center text-red-600">{stat.pp}</td>
                                    </tr>
                                )) : <tr><td colSpan={5}><EmptyState message="No hay partidos finalizados." /></td></tr>}
                            </tbody>
                        </table>
                    </div>
                </StatCard>

                <StatCard title="Disciplina" icon="🟥">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <TableHeader columns={['Jugador', 'Amarillas', 'Rojas']} />
                            <tbody>
                                {disciplineRanking.length > 0 ? disciplineRanking.map(stat => (
                                     <tr key={stat.player.id} onClick={() => onViewProfile(stat.player)} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-2 font-semibold">{stat.player.nickname}</td>
                                        <td className="p-2 text-center">
                                            <span className="inline-block w-5 h-5 bg-yellow-400 mr-1"></span>
                                            {stat.yellowCards}
                                        </td>
                                        <td className="p-2 text-center">
                                             <span className="inline-block w-5 h-5 bg-red-600 mr-1"></span>
                                            {stat.redCards}
                                        </td>
                                    </tr>
                                )) : <tr><td colSpan={3}><EmptyState message="Nadie ha recibido tarjetas." /></td></tr>}
                            </tbody>
                        </table>
                    </div>
                </StatCard>
            </div>
        </div>
    );
};