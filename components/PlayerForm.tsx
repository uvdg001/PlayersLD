
import React, { useState, useRef } from 'react';
import type { Player } from '../types';
import { PlayerRole } from '../types';
import { StarRating } from './StarRating';

interface PlayerFormProps {
    player: Player | null;
    onSave: (player: Player | Omit<Player, 'id'>) => void;
    onCancel: () => void;
}

export const PlayerForm: React.FC<PlayerFormProps> = ({ player, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        firstName: player?.firstName || '',
        lastName: player?.lastName || '',
        nickname: player?.nickname || '',
        photoUrl: player?.photoUrl || '',
        skillLevel: player?.skillLevel || 3,
        role: player?.role || PlayerRole.MEDIOCAMPO,
        pin: player?.pin || '',
        birthDate: player?.birthDate || '',
    });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
                setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (player) {
            onSave({ ...player, ...formData });
        } else {
            onSave(formData);
        }
    };

    const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-white text-gray-900 dark:bg-gray-900 dark:text-white dark:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{player ? 'Editar Jugador' : 'Agregar Nuevo Jugador'}</h3>
            
            <div className="flex items-center space-x-4">
                {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover" />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" /></svg>
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Foto del Jugador</label>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium">Nombre</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium">Apellido</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                    <label htmlFor="nickname" className="block text-sm font-medium">Apodo</label>
                    <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} required className={inputClass} />
                </div>
                <div>
                    <label htmlFor="role" className="block text-sm font-medium">Rol Principal</label>
                    <select name="role" value={formData.role} onChange={handleChange} className={inputClass}>
                        {Object.values(PlayerRole).map(roleValue => (
                            <option key={roleValue} value={roleValue}>{roleValue}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="pin" className="block text-sm font-medium">PIN de 4 dígitos</label>
                    <input 
                        type="tel"
                        name="pin" 
                        value={formData.pin} 
                        onChange={handleChange} 
                        required 
                        maxLength={4} 
                        pattern="\d{4}"
                        title="El PIN debe contener 4 números."
                        autoComplete="off"
                        className={inputClass} />
                </div>
                 <div>
                    <label htmlFor="birthDate" className="block text-sm font-medium">Fecha de Nacimiento</label>
                    <input 
                        type="date"
                        name="birthDate" 
                        value={formData.birthDate} 
                        onChange={handleChange} 
                        className={inputClass} />
                </div>
            </div>

            <div>
                 <label className="block text-sm font-medium">Nivel de Habilidad</label>
                 <StarRating rating={formData.skillLevel} onRatingChange={handleSkillChange} interactive={true} />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 rounded-md">
                    Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm">
                    Guardar Jugador
                </button>
            </div>
        </form>
    );
};
