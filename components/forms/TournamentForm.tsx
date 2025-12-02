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
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value, 10) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (tournament) {
            onSave({ ...tournament, ...formData });
        } else {
            onSave(formData);
        }
    };

    const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onCancel}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{tournament ? 'Editar Torneo' : 'Crear Nuevo Torneo'}</h3>
                    
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium">Nombre del Torneo</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass} />
                    </div>

                    <div>
                        <label htmlFor="year" className="block text-sm font-medium">Año</label>
                        <input type="number" name="year" value={formData.year} onChange={handleChange} required className={inputClass} />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium">Descripción</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className={inputClass} />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 rounded-md">
                            Cancelar
                        </button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm">
                            Guardar Torneo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};