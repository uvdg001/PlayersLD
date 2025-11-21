import React from 'react';
import type { PlayerStats } from '../../types';
import { StarRating } from '../StarRating';


interface StatisticsPageProps {
    stats: PlayerStats[];
    canViewRatings: boolean;
}

const StatCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
        {children}
    </div>
);

export const StatisticsPage: React.FC<StatisticsPageProps> = ({ stats, canViewRatings }) => {
    const ratingRanking = [...stats]
        .filter(s => s.ratingCount > 0)
        .sort((a, b) => b.avgRating - a.avgRating);

    const attendanceRanking = [...stats]
        .sort((a, b) => b.attendance.confirmed - a.attendance.confirmed);

    const individualStatsSorted = [...stats].sort((a, b) =>
        a.player.nickname.localeCompare(b.player.nickname)
    );

    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">Estadísticas del Equipo</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <StatCard title="🏆 Salón de la Fama - Calificaciones">
                    {canViewRatings ? (
                        <div className="space-y-3">
                            {ratingRanking.length > 0 ? ratingRanking.map((stat, index) => (
                                <div key={stat.player.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                                        <span className="font-bold text-lg w-8 text-center">{index + 1}°</span>
                                        <img src={stat.player.photoUrl || undefined} alt={stat.player.nickname} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                                        <div className="truncate">
                                            <p className="font-semibold truncate">{stat.player.nickname}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{stat.player.firstName} {stat.player.lastName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <StarRating rating={stat.avgRating} />
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Promedio de {stat.ratingCount} votos</p>
                                    </div>
                                </div>
                            )) : <p className="text-gray-500 dark:text-gray-400">No hay calificaciones todavía.</p>}
                        </div>
                    ) : (
                        <div className="text-center p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                            <p className="font-semibold text-yellow-800 dark:text-yellow-200">Calificaciones Bloqueadas</p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                Completa tus calificaciones pendientes en los partidos con votación abierta para ver el Salón de la Fama.
                            </p>
                        </div>
                    )}
                </StatCard>

                <StatCard title="✅ Récord de Asistencia">
                     <div className="space-y-3">
                        {attendanceRanking.map(stat => (
                            <div key={stat.player.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                 <div className="flex items-center space-x-4 flex-1 min-w-0">
                                     <img src={stat.player.photoUrl || undefined} alt={stat.player.nickname} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                                     <div className="truncate">
                                        <p className="font-semibold truncate">{stat.player.nickname}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{stat.player.firstName} {stat.player.lastName}</p>
                                    </div>
                                 </div>
                                <div className="flex space-x-4 text-center flex-shrink-0 ml-4">
                                    <div>
                                        <p className="font-bold text-lg text-green-500">{stat.attendance.confirmed}</p>
                                        <p className="text-xs">Sí</p>
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg text-yellow-500">{stat.attendance.doubtful}</p>
                                        <p className="text-xs">Duda</p>
                                    </div>
                                     <div>
                                        <p className="font-bold text-lg text-red-500">{stat.attendance.absent}</p>
                                        <p className="text-xs">No</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                     </div>
                </StatCard>
            </div>

            <StatCard title="📊 Estadísticas Individuales">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="p-3 text-sm font-semibold tracking-wide">Jugador</th>
                                <th className="p-3 text-sm font-semibold tracking-wide text-center">PJ</th>
                                <th className="p-3 text-sm font-semibold tracking-wide text-center">Cuartos Jugados</th>
                                <th className="p-3 text-sm font-semibold tracking-wide text-right">Aportes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {individualStatsSorted.map(stat => (
                                <tr key={stat.player.id}>
                                    <td className="p-2">
                                        <div className="flex items-center space-x-3">
                                            <img src={stat.player.photoUrl || undefined} alt={stat.player.nickname} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                            <div className="truncate">
                                                <p className="font-semibold truncate">{stat.player.nickname}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{stat.player.firstName} {stat.player.lastName}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-2 text-center font-medium">{stat.attendance.confirmed}</td>
                                    <td className="p-2 text-center font-medium">{stat.totalQuartersPlayed}</td>
                                    <td className="p-2 text-right font-medium">{formatter.format(stat.totalAmountPaid)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </StatCard>
        </div>
    );
};