
import React from 'react';
import type { Match } from '../../types.ts';

interface TreasuryData {
    totalSpent: number;
    totalCollected: number;
    balance: number;
    matches: (Match & { collected: number, balance: number })[];
}

interface TreasuryPageProps {
    data: TreasuryData;
}

const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const SummaryCard: React.FC<{ title: string, value: number, colorClass: string }> = ({ title, value, colorClass }) => (
    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center shadow-sm">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">{title}</p>
        <p className={`text-4xl font-black ${colorClass}`}>{formatter.format(value)}</p>
    </div>
);

export const TreasuryPage: React.FC<TreasuryPageProps> = ({ data }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-lg p-8 space-y-12 animate-fadeIn border-t-8 border-indigo-600">
            <h2 className="text-6xl font-black text-center text-gray-800 dark:text-gray-100 uppercase italic tracking-tighter leading-none">Caja Fuerte</h2>
            
            <div>
                <h3 className="text-2xl font-black mb-6 text-gray-700 dark:text-gray-200 uppercase tracking-tight">Balance por Partido</h3>
                <div className="overflow-x-auto border-2 dark:border-gray-700 rounded-3xl shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-200 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
                            <tr>
                                <th className="p-4 text-xs font-black tracking-widest uppercase">Fecha</th>
                                <th className="p-4 text-xs font-black tracking-widest uppercase text-right">Costo Cancha</th>
                                <th className="p-4 text-xs font-black tracking-widest uppercase text-right">Recaudado</th>
                                <th className="p-4 text-xs font-black tracking-widest uppercase text-right">Estado</th>
                                <th className="p-4 text-xs font-black tracking-widest uppercase text-right">Diferencia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {data.matches.length > 0 ? data.matches.map(match => {
                                const isCovered = match.balance >= 0;
                                return (
                                    <tr key={match.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="p-4 text-sm">
                                            <span className="font-black block uppercase tracking-tight">{match.date}</span>
                                            {match.tournamentRound && <span className="text-[10px] text-indigo-500 font-bold">FECHA {match.tournamentRound}</span>}
                                        </td>
                                        <td className="p-4 text-sm text-right font-bold">{formatter.format(match.courtFee)}</td>
                                        <td className="p-4 text-sm text-right font-bold text-blue-600 dark:text-blue-400">{formatter.format(match.collected)}</td>
                                        <td className="p-4 text-sm text-right">
                                            {isCovered ? (
                                                <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-[10px] font-black uppercase">✅ Cubierto</span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-[10px] font-black uppercase">❌ Déficit</span>
                                            )}
                                        </td>
                                        <td className={`p-4 text-lg font-black text-right ${isCovered ? 'text-green-600' : 'text-red-600'}`}>
                                            {formatter.format(match.balance)}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-16 text-gray-500 dark:text-gray-400 font-bold italic">
                                        No hay partidos finalizados cargados en la base de datos.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="pt-10 border-t-4 border-dashed border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-black mb-8 text-gray-700 dark:text-gray-200 uppercase tracking-tight">Cierre General Acumulado</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SummaryCard title="Gasto Total (Canchas)" value={data.totalSpent} colorClass="text-red-600 dark:text-red-400" />
                    <SummaryCard title="Recaudación Total" value={data.totalCollected} colorClass="text-green-600 dark:text-green-400" />
                    <div className={`p-6 rounded-3xl text-center shadow-2xl border-4 transition-transform hover:scale-105 ${data.balance >= 0 ? 'bg-green-50 border-green-500 dark:bg-green-900/30' : 'bg-red-50 border-red-500 dark:bg-red-900/30'}`}>
                        <p className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-300 tracking-widest mb-1">Saldo Final en Caja</p>
                        <p className={`text-5xl font-black ${data.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatter.format(data.balance)}
                        </p>
                        <p className="text-[10px] mt-2 font-black uppercase tracking-widest opacity-70">
                            {data.balance >= 0 ? '¡Cuentas Claras!' : '¡Alguien debe plata!'}
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};
