import React from 'react';
import type { Match } from '../../types';

interface TreasuryData {
    totalSpent: number;
    totalCollected: number;
    balance: number;
    matches: (Match & { collected: number, balance: number })[];
}

interface TreasuryPageProps {
    data: TreasuryData;
}

const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

const SummaryCard: React.FC<{ title: string, value: number, colorClass: string }> = ({ title, value, colorClass }) => (
    <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</p>
        <p className={`text-2xl font-bold ${colorClass}`}>{formatter.format(value)}</p>
    </div>
);

export const TreasuryPage: React.FC<TreasuryPageProps> = ({ data }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-8">
            <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100">Tesorería del Equipo</h2>

            <div>
                <h3 className="text-xl font-bold mb-4">Resumen General</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SummaryCard title="Total Gastado (Canchas)" value={data.totalSpent} colorClass="text-red-600 dark:text-red-400" />
                    <SummaryCard title="Total Recaudado" value={data.totalCollected} colorClass="text-green-600 dark:text-green-400" />
                    <SummaryCard 
                        title="Saldo General" 
                        value={data.balance} 
                        colorClass={data.balance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"} 
                    />
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold mb-4">Historial por Partido</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="p-3 text-sm font-semibold tracking-wide">Fecha</th>
                                <th className="p-3 text-sm font-semibold tracking-wide">Costo Cancha</th>
                                <th className="p-3 text-sm font-semibold tracking-wide">Recaudado</th>
                                <th className="p-3 text-sm font-semibold tracking-wide">Saldo del Partido</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.matches.map(match => (
                                <tr key={match.id} className="border-b dark:border-gray-700">
                                    <td className="p-3 text-sm">{match.date}</td>
                                    <td className="p-3 text-sm">{formatter.format(match.courtFee)}</td>
                                    <td className="p-3 text-sm text-green-600 dark:text-green-400">{formatter.format(match.collected)}</td>
                                    <td className={`p-3 text-sm font-semibold ${match.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {formatter.format(match.balance)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
