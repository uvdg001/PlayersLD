import React, { useState } from 'react';
import type { Tournament } from '../../types.ts';

interface TournamentFormProps {
    tournament: Tournament | null;
    onSave: (tournament: Tournament | Omit<Tournament, 'id'>) => void;
    onCancel: () => void;
}

export const TournamentForm: React.FC<TournamentFormProps> = ({ tournament, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: tournament?.name || '',
        year: tournament?.year || new Date().getFullYear(),
        description: tournament?.description || '',
        status: tournament?.status || 'EN_CURSO',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value, 10) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (tournament) {
            onSave({ ...tournament, ...formData } as Tournament);
        } else {
            onSave(formData);
        }
    };

    const inputClass = "mt-1 block w-full rounded-2xl border-2 border-gray-200 shadow-sm bg-white text-gray-900 dark:bg-gray-900 dark:text-white dark:border-gray-700 focus:border-indigo-500 focus:ring-indigo-500 p-3 font-bold outline-none transition-all";

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-[100] p-4" onClick={onCancel}>
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg border-4 border-indigo-500 overflow-hidden" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <header className="text-center mb-2">
                        <h3 className="text-3xl font-black text-gray-800 dark:text-gray-100 uppercase italic tracking-tighter">
                            {tournament ? 'Editar Torneo' : 'Crear Nuevo Torneo'}
                        </h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Configuración de campeonato</p>
                    </header>
                    
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-[10px] font-black text-gray-500 uppercase ml-2 mb-1">Nombre del Torneo</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass} placeholder="Ej: Apertura 2025" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="year" className="block text-[10px] font-black text-gray-500 uppercase ml-2 mb-1">Año</label>
                                <input type="number" name="year" value={formData.year} onChange={handleChange} required className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-[10px] font-black text-indigo-600 uppercase ml-2 mb-1">Estado</label>
                                <select name="status" value={formData.status} onChange={handleChange} className={`${inputClass} text-indigo-600`}>
                                    <option value="EN_CURSO">🟢 En Curso</option>
                                    <option value="FINALIZADO">🏁 Finalizado</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-[10px] font-black text-gray-500 uppercase ml-2 mb-1">Descripción corta</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className={inputClass} placeholder="Ej: Torneo de los jueves en El Predio" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4 border-t-2 border-dashed dark:border-gray-700">
                        <button type="submit" className="w-full py-4 text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-500/30 transition-all transform active:scale-95 uppercase tracking-widest">
                            {tournament ? 'GUARDAR CAMBIOS' : 'CREAR TORNEO OFICIAL'}
                        </button>
                        <button type="button" onClick={onCancel} className="w-full py-3 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors uppercase tracking-widest">
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};