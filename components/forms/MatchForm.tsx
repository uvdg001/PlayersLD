
import React, { useState, useEffect } from 'react';
import type { Match, Venue, Opponent, MatchStatus } from '../../types.ts';

interface MatchFormProps {
    match?: Match | null;
    onSave: (matchData: Match | Omit<Match, 'id' | 'playerStatuses' | 'ratingStatus'>) => void;
    onCancel: () => void;
    venues: Venue[];
    opponents: Opponent[];
    allMatches?: Match[];
    nextRoundNumber?: number;
    tournamentId?: number; 
}

const formatDateForInput = (dateString: string) => {
    try {
        const parts = dateString.replace(/ de/g, '').split(' ');
        const day = parts[1];
        const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        const month = monthNames.indexOf(parts[2].toLowerCase());
        const year = parts[3];
        const date = new Date(Number(year), month, Number(day));
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    } catch (e) { /* ignore */ }
    
    try {
        const date = new Date(dateString);
         if (!isNaN(date.getTime())) {
            const tzOffset = date.getTimezoneOffset() * 60000;
            const localDate = new Date(date.getTime() + tzOffset);
            return localDate.toISOString().split('T')[0];
        }
    } catch(e) { /* ignore */ }
    
    return new Date().toISOString().split('T')[0];
};

export const MatchForm: React.FC<MatchFormProps> = ({ match = null, onSave, onCancel, venues, opponents, allMatches = [], nextRoundNumber, tournamentId }) => {
    
    const getInitialState = () => {
        if (match) {
            return {
                date: formatDateForInput(match.date),
                time: match.time,
                warmUpTime: match.warmUpTime || '14:30',
                coachTalkTime: match.coachTalkTime || '14:45',
                courtFee: match.courtFee.toString(),
                tournamentRound: match.tournamentRound?.toString() || '1',
                venueId: match.venueId?.toString() || (venues[0]?.id.toString() || ''),
                opponentId: match.opponentId?.toString() || (opponents[0]?.id.toString() || ''),
                courtNumber: match.courtNumber || '',
                status: match.status || 'PROGRAMADO',
                opponentScore: match.opponentScore?.toString() || '0',
            };
        }
        return {
            date: new Date().toISOString().split('T')[0],
            time: '15:00',
            warmUpTime: '14:30',
            coachTalkTime: '14:45',
            courtFee: '100000',
            tournamentRound: nextRoundNumber?.toString() || '1',
            venueId: venues[0]?.id.toString() || '',
            opponentId: opponents[0]?.id.toString() || '',
            courtNumber: '',
            status: 'PROGRAMADO' as MatchStatus,
            opponentScore: '0',
        };
    };
    
    const [formData, setFormData] = useState(getInitialState);
    
    useEffect(() => {
        if (!match && nextRoundNumber) {
             setFormData(prev => ({ ...prev, tournamentRound: nextRoundNumber.toString() }));
        }
    }, [match, nextRoundNumber]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const currentTournamentId = match?.tournamentId || tournamentId;
        const newRound = parseInt(formData.tournamentRound, 10);

        const isDuplicate = allMatches.some(m => 
            m.tournamentId === currentTournamentId && 
            m.tournamentRound === newRound && 
            m.id !== match?.id
        );

        if (isDuplicate) {
            alert(`⚠️ ERROR: La "Fecha ${newRound}" ya existe en este torneo.`);
            return;
        }

        const venue = venues.find(v => v.id === parseInt(formData.venueId, 10));
        const dateForSave = new Date(formData.date);
        const tzOffset = dateForSave.getTimezoneOffset() * 60000;
        const localDate = new Date(dateForSave.getTime() + tzOffset);

        const saveData = {
            date: localDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).replace(/^\w/, c => c.toUpperCase()),
            time: formData.time,
            warmUpTime: formData.warmUpTime,
            coachTalkTime: formData.coachTalkTime,
            courtFee: parseFloat(formData.courtFee),
            tournamentRound: newRound,
            venueId: parseInt(formData.venueId, 10),
            opponentId: parseInt(formData.opponentId, 10),
            location: venue?.name || 'Cancha a definir',
            address: venue?.address || 'Dirección a definir',
            courtNumber: formData.courtNumber,
            status: formData.status as MatchStatus,
            opponentScore: formData.status === 'FINALIZADO' ? parseInt(formData.opponentScore, 10) : undefined,
            tournamentId: currentTournamentId, 
        };
        
        onSave(match ? { ...match, ...saveData } : saveData);
    };

    const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 p-2";

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[70] p-4" onClick={onCancel}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="flex justify-between items-center border-b pb-4 dark:border-gray-700">
                        <h3 className="text-2xl font-black text-gray-800 dark:text-gray-100 uppercase tracking-tighter italic">{match ? 'Editar Partido' : 'Nueva Fecha'}</h3>
                        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-red-500">✕</button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* FECHA CABECERA */}
                        <div className="md:col-span-2 bg-indigo-600 p-4 rounded-xl shadow-lg">
                            <label htmlFor="tournamentRound" className="block text-[10px] font-black text-indigo-100 uppercase tracking-[0.2em] mb-1">Número de Fecha</label>
                            <input 
                                type="number" 
                                name="tournamentRound" 
                                value={formData.tournamentRound} 
                                onChange={handleChange} 
                                required 
                                className="w-full bg-white/10 border-2 border-white/20 text-white font-black text-center text-3xl rounded-lg focus:bg-white/20 outline-none" 
                            />
                        </div>

                        {/* BLOQUE 1: TIEMPOS PRINCIPALES */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Día del Partido</label>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputClass} />
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                            <label className="block text-xs font-bold text-red-500 uppercase mb-1">Hora de Inicio (PITAZO)</label>
                            <input type="time" name="time" value={formData.time} onChange={handleChange} required className={inputClass} />
                        </div>

                        {/* BLOQUE 2: LOGÍSTICA (IMPORTANTE) */}
                        <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl border-2 border-dashed border-indigo-200 dark:border-indigo-800">
                            <div>
                                <label className="block text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-wider mb-1">🕒 Llegada Vestuario</label>
                                <input type="time" name="warmUpTime" value={formData.warmUpTime} onChange={handleChange} required className={inputClass} />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">🔥 Entrada en Calor</label>
                                <input type="time" name="coachTalkTime" value={formData.coachTalkTime} onChange={handleChange} required className={inputClass} />
                            </div>
                            <p className="md:col-span-2 text-[9px] text-indigo-400 font-bold uppercase text-center mt-1">Estos horarios aparecerán destacados en la convocatoria.</p>
                        </div>

                        {/* BLOQUE 3: LUGAR Y RIVAL */}
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cancha / Predio</label>
                            <select name="venueId" value={formData.venueId} onChange={handleChange} required className={inputClass}>
                                {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Equipo Rival</label>
                            <select name="opponentId" value={formData.opponentId} onChange={handleChange} required className={inputClass}>
                                {opponents.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                        </div>

                        {/* BLOQUE 4: OTROS */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Costo Cancha ($)</label>
                            <input type="number" name="courtFee" value={formData.courtFee} onChange={handleChange} required className={inputClass} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estado</label>
                            <select name="status" value={formData.status} onChange={handleChange} required className={inputClass}>
                                <option value="PROGRAMADO">Programado</option>
                                <option value="FINALIZADO">Finalizado</option>
                                <option value="SUSPENDIDO">Suspended</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-6 border-t dark:border-gray-700">
                        <button type="button" onClick={onCancel} className="flex-1 py-3 text-sm font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors uppercase">
                            Cancelar
                        </button>
                        <button type="submit" className="flex-[2] py-3 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-500/30 transition-all active:scale-95 uppercase tracking-widest">
                            {match ? 'Actualizar Fecha' : 'Crear Fecha Oficial'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
