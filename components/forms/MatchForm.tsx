
import React, { useState, useEffect } from 'react';
import type { Match, Venue, Opponent, MatchStatus } from '../../types';

interface MatchFormProps {
    match?: Match | null;
    onSave: (matchData: Match | Omit<Match, 'id' | 'playerStatuses' | 'ratingStatus'>) => void;
    onCancel: () => void;
    venues: Venue[];
    opponents: Opponent[];
    tournamentMatches?: Match[];
    nextRoundNumber?: number;
}

// Helper to convert date for input[type=date]
const formatDateForInput = (dateString: string) => {
    try {
        // Assuming format "Sábado, 13 de julio de 2024" or similar
        // A more robust solution might be needed if date formats vary
        const date = new Date(dateString.split(', ')[1]);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    } catch (e) { /* ignore */ }
    
    try {
        const date = new Date(dateString);
         if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    } catch(e) { /* ignore */ }
    
    // Fallback for simple formats like YYYY-MM-DD
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
        // Adjust for timezone offset to prevent day-before issues
        const tzOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - tzOffset);
        return localDate.toISOString().split('T')[0];
    }
    
    return new Date().toISOString().split('T')[0];
};


export const MatchForm: React.FC<MatchFormProps> = ({ match = null, onSave, onCancel, venues, opponents, tournamentMatches, nextRoundNumber }) => {
    
    const getInitialState = () => {
        if (match) {
            return {
                date: formatDateForInput(match.date),
                time: match.time,
                courtFee: match.courtFee.toString(),
                tournamentRound: match.tournamentRound?.toString() || '1',
                venueId: match.venueId?.toString() || (venues[0]?.id.toString() || ''),
                opponentId: match.opponentId?.toString() || (opponents[0]?.id.toString() || ''),
                courtNumber: match.courtNumber || '',
                status: match.status || 'PROGRAMADO',
                myTeamScore: match.myTeamScore?.toString() || '0',
                opponentScore: match.opponentScore?.toString() || '0',
            };
        }
        return {
            date: new Date().toISOString().split('T')[0],
            time: '15:00',
            courtFee: '50000',
            tournamentRound: nextRoundNumber?.toString() || '1',
            venueId: venues[0]?.id.toString() || '',
            opponentId: opponents[0]?.id.toString() || '',
            courtNumber: '',
            status: 'PROGRAMADO' as MatchStatus,
            myTeamScore: '0',
            opponentScore: '0',
        };
    };
    
    const [formData, setFormData] = useState(getInitialState);
    
    useEffect(() => {
        setFormData(getInitialState());
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [match, venues, opponents, nextRoundNumber]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation for duplicate round number
        if (tournamentMatches) {
            const newRound = parseInt(formData.tournamentRound, 10);
            const isDuplicate = tournamentMatches.some(
                m => m.tournamentRound === newRound && m.id !== match?.id
            );
            if (isDuplicate) {
                alert('¡Error! El número de fecha ya existe para este torneo. Por favor, elige otro.');
                return;
            }
        }

        const venue = venues.find(v => v.id === parseInt(formData.venueId, 10));
        
        const dateForSave = new Date(formData.date);
        const tzOffset = dateForSave.getTimezoneOffset() * 60000;
        const localDate = new Date(dateForSave.getTime() + tzOffset);

        const saveData = {
            date: localDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            time: formData.time,
            courtFee: parseFloat(formData.courtFee),
            tournamentRound: parseInt(formData.tournamentRound, 10),
            venueId: parseInt(formData.venueId, 10),
            opponentId: parseInt(formData.opponentId, 10),
            location: venue?.name || 'Cancha a definir',
            address: venue?.address || 'Dirección a definir',
            courtNumber: formData.courtNumber,
            status: formData.status as MatchStatus,
            myTeamScore: formData.status === 'FINALIZADO' ? parseInt(formData.myTeamScore, 10) : undefined,
            opponentScore: formData.status === 'FINALIZADO' ? parseInt(formData.opponentScore, 10) : undefined,
        };
        
        if (match) {
            onSave({ ...match, ...saveData });
        } else {
            onSave(saveData);
        }
    };

    const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] p-4" onClick={onCancel}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{match ? 'Editar Fecha' : 'Agregar Nueva Fecha'}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium">Fecha</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="time" className="block text-sm font-medium">Hora</label>
                            <input type="time" name="time" value={formData.time} onChange={handleChange} required className={inputClass} />
                        </div>
                         <div>
                            <label htmlFor="venueId" className="block text-sm font-medium">Cancha</label>
                            <select name="venueId" value={formData.venueId} onChange={handleChange} required className={inputClass}>
                                {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="opponentId" className="block text-sm font-medium">Rival</label>
                            <select name="opponentId" value={formData.opponentId} onChange={handleChange} required className={inputClass}>
                                {opponents.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor="tournamentRound" className="block text-sm font-medium">Nro. de Fecha</label>
                            <input type="number" name="tournamentRound" value={formData.tournamentRound} onChange={handleChange} required className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="courtFee" className="block text-sm font-medium">Costo Cancha</label>
                            <input type="number" name="courtFee" value={formData.courtFee} onChange={handleChange} required className={inputClass} />
                        </div>
                        <div>
                            <label htmlFor="courtNumber" className="block text-sm font-medium">N° de Cancha (Opcional)</label>
                            <input type="text" name="courtNumber" value={formData.courtNumber} onChange={handleChange} className={inputClass} />
                        </div>
                         <div>
                            <label htmlFor="status" className="block text-sm font-medium">Estado</label>
                            <select name="status" value={formData.status} onChange={handleChange} required className={inputClass}>
                                <option value="PROGRAMADO">Programado</option>
                                <option value="FINALIZADO">Finalizado</option>
                                <option value="SUSPENDIDO">Suspendido</option>
                            </select>
                        </div>
                        {formData.status === 'FINALIZADO' && (
                            <>
                                <div>
                                    <label htmlFor="myTeamScore" className="block text-sm font-medium">Goles Mi Equipo</label>
                                    <input type="number" name="myTeamScore" value={formData.myTeamScore} onChange={handleChange} className={inputClass} />
                                </div>
                                <div>
                                    <label htmlFor="opponentScore" className="block text-sm font-medium">Goles Rival</label>
                                    <input type="number" name="opponentScore" value={formData.opponentScore} onChange={handleChange} className={inputClass} />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 rounded-md">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm">
                            Guardar Fecha
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
