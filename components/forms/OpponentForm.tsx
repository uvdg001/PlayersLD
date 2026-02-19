import React, { useState, useRef } from 'react';
import type { Opponent } from '../../types.ts';
import { StarRating } from '../StarRating.tsx';

interface OpponentFormProps {
    opponent: Opponent | null;
    onSave: (opponent: Opponent | Omit<Opponent, 'id'>) => void;
    onCancel: () => void;
}

export const OpponentForm: React.FC<OpponentFormProps> = ({ opponent, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: opponent?.name || '',
        shieldUrl: opponent?.shieldUrl || '',
        skillLevel: opponent?.skillLevel || 3,
        jerseyColor: opponent?.jerseyColor || '#FFFFFF',
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSkillChange = (newSkill: number) => {
        setFormData(prev => ({ ...prev, skillLevel: newSkill }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, shieldUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (opponent) {
            onSave({ ...opponent, ...formData });
        } else {
            onSave(formData);
        }
    };

    const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{opponent ? 'Editar Rival' : 'Agregar Nuevo Rival'}</h3>
            
            <div className="flex items-center space-x-4">
                {formData.shieldUrl ? (
                    <img src={formData.shieldUrl} alt="Preview" className="w-24 h-24 rounded-full object-contain bg-gray-200 dark:bg-gray-700 p-1" />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Zm-1.5 6-3.75 3.75" />
                        </svg>
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Escudo del Rival</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileInputRef}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                        Subir Imagen
                    </button>
                </div>
            </div>
            
            <div>
                <label htmlFor="name" className="block text-sm font-medium">Nombre del Equipo Rival</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClass} />
            </div>

            <div>
                <label htmlFor="jerseyColor" className="block text-sm font-medium">Color de Camiseta (Opcional)</label>
                <input 
                    type="color" 
                    name="jerseyColor" 
                    value={formData.jerseyColor} 
                    onChange={handleChange} 
                    className="mt-1 block w-full h-10 p-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                />
            </div>

            <div>
                 <label className="block text-sm font-medium">Nivel de Habilidad del Rival</label>
                 <StarRating rating={formData.skillLevel} onRatingChange={handleSkillChange} interactive={true} />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 rounded-md">
                    Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm">
                    Guardar Rival
                </button>
            </div>
        </form>
    );
};